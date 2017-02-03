import _ from "lodash";
import enrichUser from "./enrich-user";

import {
  id as queryId,
  email as queryEmail,
  name as queryName,
  latest
} from "./queries";

export default function fetchUsers({ hull, search = {}, multi = false, events = true }) {
  const { email, name, id } = search;
  let params = {};

  if (id) params = queryId(id);
  else if (email) params = queryEmail(email);
  else if (name) params = queryName(name);
  else params = latest();

  hull.logger.debug("user.search", params);

  return hull.post("search/user_reports", params)
  .then((args) => {
    const { data: users = [] } = args;

    if (!users.length) return Promise.reject({ message: "User not found!" });

    // If searching for a single user, only use the first result. else use all (list)

    if (multi) return Promise.all(_.map(users, user => enrichUser({ hull, user, events })));

    return enrichUser({ hull, user: users[0], events });
  });
}
