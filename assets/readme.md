# Hull Webhooks

This Ship sends user updates as Webhooks

##  Installing

- Go to Settings, Enter the Webhook URL (you can input more than one)
- Define conditions for User to be sent

## Configuring the Webhooks connector

There are two sections in Hull's Settings tab to help you define which users will be sent as POST webhooks.

The first section has a Segments filter.

It defines who will be sent. An empty list sends no one. To start, create a User segment defining who should be sent. This is a global filter, the conditions below will only be checked only if the User matches this filter.

The Second section defines additional conditions to send a user. User will be sent as soon as one of these conditions match.

- When entering and/or leaving a given segment
- When a specific property changes
- When A specific event is performed.

When one or more of these conditions are fullfilled, a complete payload comprised of:

```json
{
  "user": "The Entire User profile with all attributes",
  "segments": "Every segment the User belongs to, as objects containing unique Segment IDs",
  "changes": "Every change that caused this user to be recomputed",
  "events": "The events that triggered the send, if any" //optional
}
```
