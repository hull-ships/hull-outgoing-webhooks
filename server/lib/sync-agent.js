// @flow
import type {
  THullUserUpdateMessage,
  THullAccountUpdateMessage,
  THullConnector,
  THullReqContext
} from "hull";

const Promise = require("bluebird");
const _ = require("lodash");
const Throttle = require("superagent-throttle");

const webhook = require("./webhook");

class SyncAgent {
  // TODO: replace all of those generic types with new coming from hull libraries
  metric: Object;
  smartNotifierResponse: ?Object;
  hullClient: Object;
  connector: THullConnector;
  throttlePool: {
    [string]: Throttle
  };
  webhookUrls: Array<string>;
  isBatch: boolean;

  constructor(ctx: THullReqContext, scope: "account" | "user") {
    this.metric = ctx.metric;
    this.smartNotifierResponse = ctx.smartNotifierResponse;
    this.hullClient = ctx.client;
    this.connector = ctx.ship;
    this.webhookUrls =
      scope === "user"
        ? this.connector.private_settings.webhooks_urls || []
        : this.connector.private_settings.webhooks_account_urls || [];

    const throttleSettings = this.getThrottleSettings(this.connector);
    this.throttlePool = this.webhookUrls.reduce(
      (acc: Object, value: string) => {
        acc[value] = new Throttle(throttleSettings);
        return acc;
      },
      {}
    );
    this.isBatch = this.checkIsBatch(ctx);
  }

  checkIsBatch(ctx: THullReqContext): boolean {
    return ctx.options.url && ctx.options.format && ctx.options.object_type;
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

  sendUpdateMessages(
    context: THullReqContext,
    scope: "account" | "user",
    messages: Array<THullUserUpdateMessage> | Array<THullAccountUpdateMessage>
  ) {
    this.hullClient.logger.debug("outgoing.job.start", {
      throttling: this.getThrottleSettings(this.connector)
    });
    return Promise.map(messages, message => {
      return this.sendMessage(context, scope, message);
    });
  }

  sendMessage(
    context: THullReqContext,
    targetEntity: "user" | "account",
    message: THullUserUpdateMessage | THullAccountUpdateMessage
  ): boolean {
    const { private_settings = {} } = this.connector;
    const isBatch = this.isBatch;

    const {
      user = {},
      account = {},
      segments = [],
      account_segments = [],
      changes = {},
      events = []
    } = message;

    let webhooks_anytime_path;
    let webhooks_urls_path;
    let synchronized_segments_path;
    let webhooks_events_path;
    let webhooks_attributes_path;
    let webhooks_segments_path;

    if (targetEntity === "user") {
      webhooks_anytime_path = "webhooks_anytime";
      webhooks_urls_path = "webhooks_urls";
      synchronized_segments_path = "synchronized_segments";
      webhooks_events_path = "webhooks_events";
      webhooks_attributes_path = "webhooks_attributes";
      webhooks_segments_path = "webhooks_segments";
    } else if (targetEntity === "account") {
      webhooks_anytime_path = "webhooks_account_anytime";
      webhooks_urls_path = "webhooks_account_urls";
      synchronized_segments_path = "synchronized_account_segments";
      webhooks_events_path = "webhooks_account_events";
      webhooks_attributes_path = "webhooks_account_attributes";
      webhooks_segments_path = "webhooks_account_segments";
    }

    const synchronized_segments = _.get(
      private_settings,
      synchronized_segments_path
    );
    const webhooks_urls = _.get(private_settings, webhooks_urls_path);
    const webhooks_events = _.get(private_settings, webhooks_events_path);
    const webhooks_segments = _.get(private_settings, webhooks_segments_path);
    const webhooks_attributes = _.get(
      private_settings,
      webhooks_attributes_path
    );

    const webhooks_anytime = _.get(private_settings, webhooks_anytime_path);

    if (
      !this.connector ||
      !webhooks_urls.length ||
      !synchronized_segments ||
      (targetEntity === "user" && (!user || !user.id)) ||
      (targetEntity === "account" && (!account || !account.id))
    ) {
      this.hullClient.logger.debug(`outgoing.${targetEntity}.error`, message);
      if (targetEntity === "user") {
        this.hullClient.logger.error(`outgoing.${targetEntity}.error`, {
          message: "Missing user setting",
          user: !!user,
          ship: !!this.connector,
          userId: user && user.id,
          webhooks_urls: !!webhooks_urls
        });
      } else if (targetEntity === "account") {
        this.hullClient.logger.error(`outgoing.${targetEntity}.error`, {
          message: "Missing account setting",
          account: !!account,
          ship: !!this.connector,
          accountId: account && account.id,
          webhooks_urls: !!webhooks_urls
        });
      }
      return Promise.resolve();
    }

    let asTargetEntity;
    if (targetEntity === "user") {
      asTargetEntity = this.hullClient.asUser(user);
    } else if (targetEntity === "account") {
      asTargetEntity = this.hullClient.asAccount(account);
    }

    if (!synchronized_segments.length) {
      asTargetEntity.logger.info(`outgoing.${targetEntity}.skip`, {
        reason: "No Segments configured. All Users will be skipped"
      });
      return Promise.resolve();
    }

    if (
      !webhooks_events.length &&
      !webhooks_segments.length &&
      !webhooks_attributes.length
    ) {
      asTargetEntity.logger.info(`outgoing.${targetEntity}.skip`, {
        reason:
          "No Events, Segments or Attributes configured. No Webhooks will be sent"
      });
      return Promise.resolve();
    }

    const segmentScope =
      targetEntity === "user" ? "segments" : "account_segments";

    const entityInSegments = _.map(_.get(message, segmentScope, []), "id");

    if (isBatch) {
      this.metric.increment("ship.outgoing.events");
      return this.callWebhookUrls(targetEntity, {
        user,
        entityInSegments,
        account
      });
    }

    const matchedEnteredSegments = _.map(
      this.getSegmentChanges(
        webhooks_segments,
        changes,
        "entered",
        targetEntity
      ),
      "id"
    );

    const matchedLeftSegments = _.map(
      this.getSegmentChanges(webhooks_segments, changes, "left", targetEntity),
      "id"
    );

    const global_synchronized_segments = _.compact(
      _.concat(
        synchronized_segments,
        matchedEnteredSegments,
        matchedLeftSegments
      )
    );

    const globalEntitySegments = _.compact(
      _.concat(entityInSegments, matchedEnteredSegments, matchedLeftSegments)
    );

    if (
      !_.intersection(global_synchronized_segments, globalEntitySegments).length
    ) {
      asTargetEntity.logger.info(`outgoing.${targetEntity}.skip`, {
        reason: `${targetEntity} does not match filtered segments`
      });
      return Promise.resolve();
    }

    const filteredSegments = _.intersection(
      synchronized_segments,
      entityInSegments
    );

    const changesScope = targetEntity === "user" ? "user." : "";
    const matchedAttributes = _.filter(
      webhooks_attributes,
      webhook_attribute => {
        const traitsPrefix = `traits_${webhook_attribute.replace(
          "account.",
          ""
        )}`;

        const attribute = _.get(
          changes,
          `${changesScope}${webhook_attribute}`,
          null
        );

        const traitsPrefixAttribute = _.get(
          changes,
          `${changesScope}${traitsPrefix}`,
          null
        );

        return attribute !== null || traitsPrefixAttribute !== null;
      }
    );

    const matchedEvents = _.filter(events, event =>
      _.includes(webhooks_events, event.event)
    );

    // Payload
    const payload = {
      user: this.hullClient.utils.groupTraits(user),
      account: this.hullClient.utils.groupTraits(account),
      segments,
      account_segments,
      changes
    };

    const loggingContext = {
      matchedEvents,
      matchedAttributes,
      filteredSegments,
      matchedEnteredSegments,
      matchedLeftSegments,
      webhooksAnytime: webhooks_anytime
    };

    // Event: Send once for each matching event.
    if (matchedEvents.length) {
      return Promise.map(matchedEvents, event => {
        this.metric.increment("ship.outgoing.events");
        this.hullClient.logger.debug("notification.send", loggingContext);
        return this.callWebhookUrls(targetEntity, { ...payload, event });
      });
    }

    if (
      matchedAttributes.length ||
      matchedEnteredSegments.length ||
      matchedLeftSegments.length ||
      webhooks_anytime
    ) {
      this.metric.increment("ship.outgoing.events");
      this.hullClient.logger.debug("notification.send", loggingContext);
      return this.callWebhookUrls(targetEntity, payload);
    }

    asTargetEntity.logger.info(`outgoing.${targetEntity}.skip`, {
      reason: `${targetEntity} did not match any conditions`
    });
    return Promise.resolve();
  }

  callWebhookUrls(
    targetEntity: "user" | "account",
    payload: Object
  ): Promise<*> {
    return Promise.map(this.webhookUrls, url => {
      const throttle = this.throttlePool[url];
      return webhook(
        {
          smartNotifierResponse: this.smartNotifierResponse,
          metric: this.metric,
          hull: this.hullClient,
          url,
          payload
        },
        throttle,
        targetEntity
      );
    });
  }

  getSegmentChanges(
    webhooks_segments: Array<Object>,
    changes: Object = {},
    action: string = "left",
    targetEntity: string = "user"
  ): Array<Object> {
    const { segments = {}, account_segments = {} } = changes;
    const entitySegments =
      targetEntity === "user" ? segments : account_segments;

    if (!_.size(entitySegments)) return [];
    const current = entitySegments[action] || [];
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
