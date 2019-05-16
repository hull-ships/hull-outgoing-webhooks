const getEntityMatchedEvents = require("../../server/util/get-entity-matched-events");
const _ = require("lodash");

describe("get matched events for entity", () => {
  const notifyEvents = ["Event1", "Event2", "Event4", "Event5", "Event6"];
  const notifyEventsEmpty = [];
  const triggeredEventsEmpty = [];
  const triggeredEvents = [
    {
      properties: {},
      event_id: "event-id-1",
      user_id: "5cc8c32f03f8929f9e000725",
      event_source: "track",
      app_name: "Processor",
      event: "Event1",
      event_type: "track",
      context: {},
      anonymous_id: null,
      ship_id: null,
      created_at: "2019-05-13T16:23:15Z",
      session_id: null,
      app_id: "app-id-1"
    },
    {
      properties: {},
      event_id: "event-id-1",
      user_id: "5cc8c32f03f8929f9e000725",
      event_source: "track",
      app_name: "Processor",
      event: "Event2",
      event_type: "track",
      context: {},
      anonymous_id: null,
      ship_id: null,
      created_at: "2019-05-13T16:23:15Z",
      session_id: null,
      app_id: "app-id-1"
    },
    {
      properties: {},
      event_id: "event-id-1",
      user_id: "5cc8c32f03f8929f9e000725",
      event_source: "track",
      app_name: "Processor",
      event: "Event3",
      event_type: "track",
      context: {},
      anonymous_id: null,
      ship_id: null,
      created_at: "2019-05-13T16:23:15Z",
      session_id: null,
      app_id: "app-id-1"
    }
  ];

  it("user matches events", () => {
    const matchedEvents = getEntityMatchedEvents(triggeredEvents, notifyEvents);

    expect(matchedEvents).toHaveLength(2);
    expect(matchedEvents[0].event).toBe("Event1");
    expect(matchedEvents[1].event).toBe("Event2");
  });

  it("no sync events defined", () => {
    const matchedEvents = getEntityMatchedEvents(
      triggeredEvents,
      notifyEventsEmpty
    );

    expect(matchedEvents).toHaveLength(0);
  });

  it("no triggered events", () => {
    const matchedEvents = getEntityMatchedEvents(
      triggeredEventsEmpty,
      notifyEvents
    );

    expect(matchedEvents).toHaveLength(0);
  });
});
