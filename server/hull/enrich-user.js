import _ from "lodash";
import { events as queryEvents } from "./queries";
import groupUser from "../lib/group-user";

export default function ({ hull, user, events = false }) {
  const q = [hull.as(user.id).get("/me/segments")];
  if (events) q.push(hull.post("search/events", queryEvents(user.id)));
  return Promise
  .all(q)
  .then(([segments, e = {}]) => ({
    user: groupUser({ hull, user }),
    events: e.data || {},
    segments: _.map(segments, s => _.pick(s, ['id', 'name', 'type'])),
    changes: {}
  }), err => console.log);
}
