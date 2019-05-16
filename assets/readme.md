# Hull Webhooks

The Outgoing Webhooks Connector sends a payload for an entity (user or account) if an event or change has been registered. 
For the user entity, payloads can be sent on event occurrences, attribute changes, and/or segment changes. 
For the account entity, payloads can be sent on attribute changes and/or segment changes. 
Both entities require that a global filter of segments be defined. 
This list is used to filter out any user or account that does not belong to a listed segment. 
If the user or account belongs to a defined segment, any changes or events on the entity will be checked as configured 
to determine if a payload should be sent. However, there is the option to send the payload regardless of an 
entity event occurrence and/or segment change given that the entity belongs to a defined segment

##  Installing

- Go to Settings, Enter the Webhook URL (you can input more than one)
- Define conditions for User to be sent

## Configuring the Webhooks connector

There are two sections per entity in the settings to define which users or accounts to send as POST webhooks.

### 1. Global Filter

This filter defines the segments that an entity must belong to in order to be sent. 
An empty list will not send any entity. 
Any additional conditions defined will only be checked if the entity matches this filter.

### 2. Additional Conditions

User payloads can be sent as soon as one of these conditions match:

- On any update (if activated)
- When entering and/or leaving a given segment
- When a specific property changes.
- When a specific event is performed.

Account payloads can be sent as soon as one of these conditions match:

- On any update (if activated)
- When entering and/or leaving a given segment
- When a specific property changes.

A payload will consist of these elements:
```js
{
  "user": "The entire user profile with all attributes",
  "account": "The entire account associated with the user with all it's attributes",
  "segments": "Every segment the user belongs to, as objects containing unique segment ids",
  "account_segments": "Every segment the account belongs to",
  "changes": "Every change that caused this user to be recomputed",
  "event": "The event that triggered the send, if any" // optional
}
```

Example Payload:

```js
{
  "account": {
    "created_at": "2017-09-20T07:19:52Z",
    "id": "59c21698cc6aeecf9b00291d",
    "is_customer": true,
    "updated_at": "2017-09-20T07:19:52Z",
    "clearbit": {
      "category_industry": "Internet Software & Services",
      "category_industry_group": "Software & Services",
      "category_sector": "Information Technology",
      "category_sub_industry": "Internet Software & Services",
      "crunchbase_handle": "organization/hull",
      "domain": "hull.io",
      /* ... */
    }
  },
  "account_segments": [
    {
      "id": "58a2e94433311e76110091b6",
      "name": "AccountSegment",
      "updated_at": "2017-11-10T15:49:59Z",
      "type": "accounts_segment",
      "created_at": "2017-11-10T15:49:59Z"
    }
  ]
  "changes": {
    "is_new": false,
    "segments": {
      "entered": [
        {
          "created_at": "2017-11-10T15:49:59Z",
          "id": "5a05caa762a2db50450000b5",
          "name": "Valid Users",
          "type": "users_segment",
          "updated_at": "2017-11-10T15:49:59Z"
        }
      ],
      "left": [
        {
          "created_at": "2016-04-27T10:17:35Z",
          "id": "572091bf13440a016c00002b",
          "name": "Views Products Frequently",
          "type": "users_segment",
          "updated_at": "2016-12-01T10:51:24Z"
        }
      ]
    },
    "user": {
      "traits_hubspot/first_name": [
        null,
        "Romain"
      ],
      "traits_mailchimp/avg_click_rate": [
        null,
        0
      ]
    }
  },
  "event": {
    "created_at": "2017-12-15T13:34:21Z",
    "event": "Viewed Product",
    "event_source": "track",
    "event_type": "track",
    "properties": {
      "category": "luctus",
      "id": 2986706563,
      "name": "Black Cat Classic Espresso",
      "price": 25,
    },
    "context": {
      "location": { },
      "page": {
        "url": "https://hull-2.myshopify.com/collections/beans/products/suspendisse-congue-sodales-massa-sit-amet-euismod-aliquet-sapien-non-dictum"
      }
    }
  },
  "segments": [
    {
      "created_at": "2017-02-14T11:25:56Z",
      "id": "58a2e94411111e76110091b6",
      "name": "Qualified Leads",
      "type": "users_segment",
      "updated_at": "2017-02-14T11:25:56Z"
    }
    /* All the segments the User belongs to... */
  ],
  "user": {
    "anonymous_ids": [
      "hubspot:636",
      "intercom:00087571-30b7-43cf-acca-a3fa5c521a72",
      "mailchimp:36a5dddea1",
      "1505891809-33056729-126b-4772-bba4-d13288aae090",
      "salesforce:00Q0Y000003iBCSUA2"
    ],
    "created_at": "2017-07-12T18:07:59Z",
    "domain": "hull.io",
    "email": "romain+syncfix@hull.io",
    "first_name": "Romain",
    "first_seen_at": "2017-07-12T16:51:13Z",
    "first_session_initial_referrer": "",
    "first_session_initial_url": "https://hull-2.myshopify.com/",
    "first_session_platform_id": "561fb665450f34b1cf000b0f",
    "first_session_started_at": "2017-07-12T16:51:13Z",
    "id": "5966657f0291901a57000026",
    "last_known_ip": "80.15.146.203",
    "last_name": "Dardour",
    "last_seen_at": "2017-12-15T13:37:15Z",
    "latest_session_initial_referrer": "https://hull-2.myshopify.com/collections/",
    "latest_session_initial_url": "https://hull-2.myshopify.com/collections/beans",
    "latest_session_platform_id": "561fb665450f34b1cf00000f",
    "latest_session_started_at": "2017-12-15T13:34:19Z",
    "clearbit": {
      "source": "enrich",
      "location": "Copenhagen, DK",
      "revealed_at": "2017-07-07T15:10:40Z",
      "site": "http://unity3d.com",
      /* ... */
    },
    "clearbit_company": {
      /* ... */
    },
    "hubspot": {
      /* ... */
    },
    "intercom": {
      /* ... */
    },
    "mailchimp": {
      /* ... */
    }
    /* More groups... */
  }
}
```

### Events handling

This connector always sends one webhook call per event. If there were many events triggered on the user profile there will be many webhook calls performed.
This way events behaves slightly different to traits or segments changes which are grouped together as shown in examples above.

### Manual extract

As an addition to ongoing updates, a manual push to the connector can be triggered using "Send to" button on Hull dashboard. It will send selected users to the connector. In this case there are no changes or events on user profile and only global segment filter will be applied to decide which users are send out.

Payload of those calls will only include `user`, `account` and `segments` properties.

### Rate limiting

Outgoing Webhooks Connector allows to adjust rate limit at which each webhook endpoint will be called. To make that possible we expose two settings: `Requests rate limit` and `Requests concurrency`:

- `Requests rate limit` is an integer which means the maximum number of requests done every 1 second.
- `Requests concurrency` is an integer which additionaly can limit the number of maximum concurrent requests our connector will open

> E.g. if you define concurrency of 2, first two requests will be fired immediately and the 3rd one will be only run after completion of any of first two.


## Limitations

### Webhook receiver endpoint must respond with 2xx status code

Our connector expect the webhook endpoint to respond with 200-204 status codes to treat it as a successfull request. Otherwise it will mark the user event as `outgoing.user.error`

### Connector doesn't support redirects

Connector does not follow redirect responses such us 301, 302 etc. Those redirects are treated as errors. To make sure that the connector works smoothly ensure that all of the urls provided in the settings are the final, resolved url addresses.

> E.g. if your final url is `https://www.webhook-url.com/endpoint/` do not use `http://webhook-url.com/endpoint` - watch out for missing `https`, `www` and trailing slash. If any of those parts are missing it may lead to redirect and cause connector to error out

### 10 requests needs to fit in 25 seconds time window

Due to our internal batching and timeouts levels we need to make sure that the connector can process 10 users in time below ~20 seconds. E.g. if the connector is set with concurrency of 1, the slowest webhook endpoint needs to respond in less than ~2 seconds to be able to finish all 10 users before our timeout will interrupt the data flow.
