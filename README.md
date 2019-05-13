# Hull Webhooks Ship.

Outgoing webhooks sends a payload for an entity (user or account) if an event or change has been registered. For the user 
entity, payloads can be sent on event occurrences, attribute changes, and/or segment changes. For the account entity, payloads 
can be sent on attribute changes and/or segment changes. Both entities require that a global filter of segments
be defined. This list is used to filter out any user or account that does not belong to a listed segment. If the user
or account belongs to a defined segment, any changes or events on the entity will be checked as configured to determine 
if a payload should be sent. However, there is the option to send the payload regardless of an entity event occurrence 
and/or segment change given that the entity belongs to a defined segment.

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-outgoing-webhooks)

---

### Using :

[See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-outgoing-webhooks.herokuapp.com)

### Developing :

- Fork
- Install

```sh
npm install
npm run start:dev
```

### Logs :

  Below list represents all specific logs for Webhooks Connector :

    * notification.error - logged when sending webhook operation returned some errors
