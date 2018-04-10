# Hull Webhooks

This Connector sends user updates and events as Webhooks

##  Installing

- Go to Settings, Enter the Webhook URL (you can input more than one)
- Define conditions for User to be sent

## Configuring the Webhooks connector

There are two sections in Hull's Settings tab to help you define which users will be sent as POST webhooks.

### The first section is a global filter for which users will be allowed to be sent.

It defines who will be sent. An empty list sends no one. To start, create a User segment defining who should be sent. This is a global filter, the conditions below will only be checked only if the User matches this filter.

### The Second section defines additional conditions to send a user.

Users will be sent as soon as one of these conditions match.

- On any update (if activated)
- When entering and/or leaving a given segment
- When a specific property changes.
- When a specific event is performed.

When one or more of these conditions are fullfilled, a complete payload comprised of:

```js
{
  "user": "The Entire User profile with all attributes",
  "account": "The Entire Account associated with the user with all it's attributes",
  "segments": "Every segment the User belongs to, as objects containing unique Segment IDs",
  "changes": "Every change that caused this user to be recomputed",
  "events": "The events that triggered the send, if any" // optional
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


### Concurrency

Outgoing Webhooks Connector allows to limit the concurrency at which each webhook endpoint will be called. The default value of the setting is 10.

> E.g. if you define concurrency of 2, first two requests will be fired immediately and the 3rd one will be only run after completion of any of first two.

If your endpoint is rate limited - that means the limit is expressed in a number of requests per time unit (for example 10 requests per second), you can use concurrency to make sure Outgoing Webhooks connector will respect this rate limit. To do so you need to know the average response time of the request. To get the information you can go to Connctor logs and search for `outgoing.user.success` - the response time is shown there as a `elapsed` property (in milliseconds).

If you have the reponse time then you can calculate the desired concurrency using following equation:

`(average number of concurrent request) = (throughput per time unit) * (average response time)`

**Example:**

Let say we have an endpoint which can handle 10 requests per second and the average response time is 500 milliseconds:

`concurrency = 10 * 0.5 (seconds)`

`concurrency = 5`

As a result we need to set concurrency setting to 5 in connectors settings.


## Limitations

### Webhook receiver endpoint must respond with 2xx status code

Our connector expect the webhook endpoint to respond with 200-204 status codes to treat it as a successfull request. Otherwise it will mark the user event as `outgoing.user.error`

### 10 requests needs to fit in 25 seconds time window

Due to our internal batching and timeouts levels we need to make sure that the connector can process 10 users in time below ~20 seconds. E.g. if the connector is set with concurrency of 1, the slowest webhook endpoint needs to respond in less than ~2 seconds to be able to finish all 10 users before our timeout will interrupt the data flow.
