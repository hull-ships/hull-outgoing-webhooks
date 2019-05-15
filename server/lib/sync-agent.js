// @flow
import type {
  THullAccountUpdateMessage,
  THullConnector,
  THullReqContext,
  THullUserUpdateMessage
} from "hull";

const getEntityMatchedSegmentChanges = require("../util/get-entity-matched-segment-changes");
const getEntityMatchedAttributeChanges = require("../util/get-entity-matched-attribute-changes");
const getEntityMatchedEvents = require("../util/get-entity-matched-events");

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
  webhook_settings: Object;
  isBatch: boolean;

  constructor(ctx: THullReqContext, targetEntity: "account" | "user") {
    this.metric = ctx.metric;
    this.smartNotifierResponse = ctx.smartNotifierResponse;
    this.hullClient = ctx.client;
    this.connector = ctx.ship;
    const { private_settings = {} } = this.connector;
    this.webhook_settings = this.getWebhookSettings(
      private_settings,
      targetEntity
    );

    const throttleSettings = this.getThrottleSettings(this.connector);
    this.throttlePool = this.webhook_settings.webhook_urls.reduce(
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

  // need to set asTargetEntity 1 time
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

    let synchronized_segments_path;
    let entity;
    let asTargetEntity;
    let segmentScope;

    if (targetEntity === "user") {
      synchronized_segments_path = "synchronized_segments";
      entity = user;
      asTargetEntity = this.hullClient.asUser(user);
      segmentScope = "segments";
    } else if (targetEntity === "account") {
      synchronized_segments_path = "synchronized_account_segments";
      entity = account;
      asTargetEntity = this.hullClient.asAccount(account);
      segmentScope = "account_segments";
    }

    const synchronized_segments = _.get(
      private_settings,
      synchronized_segments_path
    );

    if (
      !this.isConfigured(synchronized_segments, entity, targetEntity, message)
    ) {
      return Promise.resolve();
    }

    const entityInSegments = _.map(_.get(message, segmentScope, []), "id");

    if (isBatch) {
      const payload = {
        user,
        entityInSegments,
        account
      };

      return this.sendPayload(payload, targetEntity, null, {});
    }

    if (!_.intersection(synchronized_segments, entityInSegments).length) {
      asTargetEntity.logger.info(`outgoing.${targetEntity}.skip`, {
        reason: `${targetEntity} does not match filtered segments`
      });
      return Promise.resolve();
    }

    const entityMatches = this.getEntityMatches(
      entityInSegments,
      synchronized_segments,
      events,
      changes,
      targetEntity
    );
    const shouldSendMessage = this.shouldSendMessage(entityMatches);

    if (shouldSendMessage) {
      const payload = {
        user: this.hullClient.utils.groupTraits(user),
        account: this.hullClient.utils.groupTraits(account),
        segments,
        account_segments,
        changes
      };

      const loggingContext = this.getLoggingContext(entityMatches);
      return this.sendPayload(
        payload,
        targetEntity,
        loggingContext,
        entityMatches
      );
    }

    asTargetEntity.logger.info(`outgoing.${targetEntity}.skip`, {
      reason: `${targetEntity} did not match any conditions`
    });

    return Promise.resolve();
  }

  getEntityMatches(
    entityInSegments: Array<string>,
    synchronizedSegments: Array<string>,
    events: Array<Object>,
    changes: Object,
    targetEntity: "user" | "account"
  ) {
    const webhook_segments = this.webhook_settings.webhook_segments;
    const webhook_attributes = this.webhook_settings.webhook_attributes;
    const webhook_events = this.webhook_settings.webhook_events;

    const matchedEvents = getEntityMatchedEvents(events, webhook_events);

    const matchedEnteredSegments = getEntityMatchedSegmentChanges(
      webhook_segments,
      changes,
      "entered",
      targetEntity
    );

    const matchedLeftSegments = getEntityMatchedSegmentChanges(
      webhook_segments,
      changes,
      "left",
      targetEntity
    );

    const matchedAttributes = getEntityMatchedAttributeChanges(
      webhook_attributes,
      changes,
      targetEntity
    );

    const entityMatches = {};
    entityMatches.entityMatchedEvents = matchedEvents;
    entityMatches.entityMatchedAttributes = matchedAttributes;
    entityMatches.entityMatchedEnteredSegments = matchedEnteredSegments;
    entityMatches.entityMatchedLeftSegments = matchedLeftSegments;
    entityMatches.entityFilteredSegments = _.intersection(
      synchronizedSegments,
      entityInSegments
    );

    return entityMatches;
  }

  shouldSendMessage(entityMatches: Object): boolean {
    const webhook_anytime = this.webhook_settings.webhook_anytime;

    if (webhook_anytime) {
      return true;
    }

    const matchedEvents = entityMatches.entityMatchedEvents;
    const matchedAttributes = entityMatches.entityMatchedAttributes;
    const matchedEnteredSegments = entityMatches.entityMatchedEnteredSegments;
    const matchedLeftSegments = entityMatches.entityMatchedLeftSegments;

    return (
      matchedEvents.length ||
      matchedAttributes.length ||
      matchedEnteredSegments.length ||
      matchedLeftSegments.length
    );
  }

  isConfigured(
    synchronized_segments: Array<string>,
    entity: Object,
    targetEntity: "user" | "account",
    message: Object
  ): boolean {
    const webhook_events = this.webhook_settings.webhook_events;
    const webhook_segments = this.webhook_settings.webhook_segments;
    const webhook_attributes = this.webhook_settings.webhook_attributes;
    const webhook_urls = this.webhook_settings.webhook_urls;

    if (
      !this.connector ||
      !webhook_urls.length ||
      !synchronized_segments ||
      (!entity || !entity.id)
    ) {
      this.hullClient.logger.debug(`outgoing.${targetEntity}.error`, message);
      if (targetEntity === "user") {
        this.hullClient.logger.error(`outgoing.${targetEntity}.error`, {
          message: "Missing user setting",
          user: !!entity,
          ship: !!this.connector,
          userId: entity && entity.id,
          webhooks_urls: !!webhook_urls
        });
      } else if (targetEntity === "account") {
        this.hullClient.logger.error(`outgoing.${targetEntity}.error`, {
          message: "Missing account setting",
          account: !!entity,
          ship: !!this.connector,
          accountId: entity && entity.id,
          webhooks_urls: !!webhook_urls
        });
      }
      return false;
    }

    const asTargetEntity =
      targetEntity === "user"
        ? this.hullClient.asUser(entity)
        : this.hullClient.asAccount(entity);

    if (!synchronized_segments.length) {
      asTargetEntity.logger.info(`outgoing.${targetEntity}.skip`, {
        reason: "No Segments configured. All Users will be skipped"
      });
      return false;
    }

    if (
      !webhook_events.length &&
      !webhook_segments.length &&
      !webhook_attributes.length
    ) {
      asTargetEntity.logger.info(`outgoing.${targetEntity}.skip`, {
        reason:
          "No Events, Segments or Attributes configured. No Webhooks will be sent"
      });
      return false;
    }

    return true;
  }

  callWebhookUrls(
    targetEntity: "user" | "account",
    payload: Object
  ): Promise<*> {
    return Promise.map(this.webhook_settings.webhook_urls, url => {
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

  getWebhookSettings(
    private_settings: Object,
    targetEntity: "user" | "account"
  ) {
    let webhooks_anytime_path;
    let webhooks_urls_path;
    let webhooks_events_path;
    let webhooks_attributes_path;
    let webhooks_segments_path;

    if (targetEntity === "user") {
      webhooks_anytime_path = "webhooks_anytime";
      webhooks_urls_path = "webhooks_urls";
      webhooks_events_path = "webhooks_events";
      webhooks_attributes_path = "webhooks_attributes";
      webhooks_segments_path = "webhooks_segments";
    } else if (targetEntity === "account") {
      webhooks_anytime_path = "webhooks_account_anytime";
      webhooks_urls_path = "webhooks_account_urls";
      webhooks_events_path = "webhooks_account_events";
      webhooks_attributes_path = "webhooks_account_attributes";
      webhooks_segments_path = "webhooks_account_segments";
    }

    const webhook_settings = {};
    webhook_settings.webhook_urls = _.compact(
      _.get(private_settings, webhooks_urls_path) || []
    );
    webhook_settings.webhook_events =
      _.get(private_settings, webhooks_events_path) || [];
    webhook_settings.webhook_segments =
      _.get(private_settings, webhooks_segments_path) || [];
    webhook_settings.webhook_attributes =
      _.get(private_settings, webhooks_attributes_path) || [];
    webhook_settings.webhook_anytime = _.get(
      private_settings,
      webhooks_anytime_path
    );

    return webhook_settings;
  }

  sendPayload(
    payload: Object,
    targetEntity: "user" | "account",
    loggingContext: Object,
    entityMatches: Object
  ) {
    const matchedEvents = entityMatches.entityMatchedEvents;

    // Event: Send once for each matching event.
    if (matchedEvents && matchedEvents.length) {
      return Promise.map(matchedEvents, event => {
        this.metric.increment("ship.outgoing.events");
        this.hullClient.logger.debug("notification.send", loggingContext);
        return this.callWebhookUrls(targetEntity, {
          ...payload,
          event
        });
      });
    }

    this.metric.increment("ship.outgoing.events");
    this.hullClient.logger.debug("notification.send", loggingContext);
    return this.callWebhookUrls(targetEntity, payload);
  }

  getLoggingContext(entityMatches: Object) {
    const matchedEvents = entityMatches.entityMatchedEvents;
    const matchedAttributes = entityMatches.entityMatchedAttributes;
    const matchedEnteredSegments = entityMatches.entityMatchedEnteredSegments;
    const matchedLeftSegments = entityMatches.entityMatchedLeftSegments;
    const filteredSegments = entityMatches.entityFilteredSegments;
    const webhooks_anytime = this.webhook_settings.webhook_anytime;

    return {
      matchedEvents,
      matchedAttributes,
      filteredSegments,
      matchedEnteredSegments,
      matchedLeftSegments,
      webhooksAnytime: webhooks_anytime
    };
  }
}

module.exports = SyncAgent;
