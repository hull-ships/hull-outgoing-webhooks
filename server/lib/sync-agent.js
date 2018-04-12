// @flow
import type {
  THullUserUpdateMessage,
  THullConnector,
  THullReqContext
} from "hull";

const Promise = require("bluebird");
const _ = require("lodash");
const Throttle = require("superagent-throttle");

const webhook = require("./webhook");

type TSyncAgentOptions = {
  isBatch: boolean
};

class SyncAgent {
  // TODO: replace all of those generic types with new coming from hull libraries
  metric: Object;
  smartNotifierResponse: ?Object;
  hullClient: Object;
  connector: THullConnector;
  throttle: Throttle;
  isBatch: boolean;

  constructor(
    ctx: THullReqContext,
    { isBatch = false }: TSyncAgentOptions = {}
  ) {
    this.metric = ctx.metric;
    this.smartNotifierResponse = ctx.smartNotifierResponse;
    this.hullClient = ctx.client;
    this.connector = ctx.ship;
    const throttleSettings = this.getThrottleSettings(this.connector);
    this.throttle = new Throttle(throttleSettings);
    this.isBatch = isBatch;
  }

  /**
   * this method initiates the throttling module and is responsible
   * for correct configuration including good defaults.
   *
   * If customer
   * @param  {THullConnector} connector
   * @return {Throttle}
   */
  getThrottleSettings(connector: THullConnector): Object {
    const { private_settings } = connector;
    const parsedRate = parseInt(private_settings.throttle_rate, 10);
    const rate = _.isInteger(parsedRate) && parsedRate >= 1 ? parsedRate : 10;

    const parsedRatePer = parseInt(private_settings.throttle_per_rate, 10);
    const ratePer = _.isInteger(parsedRatePer) ? parsedRatePer : 1000;

    const parsedConcurrency = parseInt(private_settings.concurrency, 10);
    const concurrent = _.isInteger(parsedConcurrency) ? parsedConcurrency : 10;

    return { rate, ratePer, concurrent };
  }

  sendUserUpdateMessages(messages: Array<THullUserUpdateMessage>): Promise<*> {
    this.hullClient.logger.debug("outgoing.job.start", {
      throttling: this.getThrottleSettings(this.connector)
    });
    return Promise.map(messages, message => {
      return this.updateUser(message);
    });
  }

  updateUser(message: THullUserUpdateMessage): Promise<*> {
    const {
      user = {},
      account = {},
      segments = [],
      changes = {},
      events = []
    } = message;
    const { private_settings = {} } = this.connector;
    const {
      group_traits = false,
      webhooks_anytime,
      webhooks_urls = [],
      synchronized_segments = [],
      webhooks_events = [],
      webhooks_attributes = [],
      webhooks_segments = []
    } = private_settings;

    const asUser = this.hullClient.asUser(user);
    asUser.logger.info("outgoing.user.start");

    if (
      !user ||
      !user.id ||
      !this.connector ||
      !webhooks_urls.length ||
      !synchronized_segments
    ) {
      this.hullClient.logger.debug("outgoing.user.error", message);
      this.hullClient.logger.error("outgoing.user.error", {
        message: "Missing setting",
        user: !!user,
        ship: !!this.connector,
        userId: user && user.id,
        webhooks_urls: !!webhooks_urls
      });
      return Promise.resolve();
    }

    if (!synchronized_segments.length) {
      asUser.logger.info("outgoing.user.skip", {
        reason: "No Segments configured. All Users will be skipped"
      });
      return Promise.resolve();
    }

    if (
      !webhooks_events.length &&
      !webhooks_segments.length &&
      !webhooks_attributes.length
    ) {
      asUser.logger.info("outgoing.user.skip", {
        reason:
          "No Events, Segments or Attributes configured. No Webhooks will be sent"
      });
      return Promise.resolve();
    }

    // pluck
    const segmentIds = _.map(segments, "id");

    // Early return when sending batches. All users go through it. No changes, no events though...
    if (this.isBatch) {
      this.metric.increment("ship.outgoing.events");
      return webhook(
        {
          smartNotifierResponse: this.smartNotifierResponse,
          metric: this.metric,
          hull: this.hullClient,
          webhooks_urls,
          payload: { user, segments }
        },
        this.throttle
      );
    }

    if (!_.intersection(synchronized_segments, segmentIds).length) {
      asUser.logger.info("outgoing.user.skip", {
        reason: "User doesn't match filtered segments"
      });
      return Promise.resolve();
    }

    const filteredSegments = _.intersection(synchronized_segments, segmentIds);
    let matchedAttributes = _.intersection(
      webhooks_attributes,
      _.keys(changes.user || {})
    );
    const matchedEnteredSegments = this.getSegmentChanges(
      webhooks_segments,
      changes,
      "entered"
    );
    const matchedLeftSegments = this.getSegmentChanges(
      webhooks_segments,
      changes,
      "left"
    );
    const matchedEvents = _.filter(events, event =>
      _.includes(webhooks_events, event.event)
    );

    // some traits have "traits_" prefix in event payload but not in the settings select field.
    // we give them another try matching prefixed version
    if (_.isEmpty(matchedAttributes)) {
      matchedAttributes = _.intersection(
        _.map(webhooks_attributes, a => `traits_${a}`),
        _.keys(changes.user || {})
      );
    }

    // Payload
    const payload = {
      user: this.hullClient.utils.groupTraits(user),
      account: this.hullClient.utils.groupTraits(account),
      segments,
      changes
    };

    const loggingContext = {
      matchedEvents,
      matchedAttributes,
      filteredSegments,
      matchedEnteredSegments,
      matchedLeftSegments
    };

    // Event: Send once for each matching event.
    if (matchedEvents.length) {
      return Promise.all(
        _.map(matchedEvents, event => {
          this.metric.increment("ship.outgoing.events");
          this.hullClient.logger.debug("notification.send", loggingContext);
          webhook(
            {
              smartNotifierResponse: this.smartNotifierResponse,
              metric: this.metric,
              hull: this.hullClient,
              webhooks_urls,
              payload: { ...payload, event }
            },
            this.throttle
          );
        })
      );
    }

    // User
    // Don't send again if already sent through events.
    if (
      matchedAttributes.length ||
      matchedEnteredSegments.length ||
      matchedLeftSegments.length ||
      webhooks_anytime
    ) {
      this.metric.increment("ship.outgoing.events");
      this.hullClient.logger.debug("notification.send", loggingContext);
      return webhook(
        {
          smartNotifierResponse: this.smartNotifierResponse,
          metric: this.metric,
          hull: this.hullClient,
          webhooks_urls,
          payload
        },
        this.throttle
      );
    }

    asUser.logger.info("outgoing.user.skip", {
      reason: "User didn't match any conditions"
    });
    return Promise.resolve();
  }

  getSegmentChanges(
    webhooks_segments: Array<Object>,
    changes: Object = {},
    action: string = "left"
  ): Array<Object> {
    const { segments = {} } = changes;
    if (!_.size(segments)) return [];
    const current = segments[action] || [];
    if (!current.length) return [];

    // Get list of segments we're validating against for a given changeset
    const filter = _.map(
      _.filter(webhooks_segments, e => e[action]),
      "segment"
    );

    // List of User segments matching entered or left
    return _.filter(current, s => _.includes(filter, s.id));
  }
}

module.exports = SyncAgent;
