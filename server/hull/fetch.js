import _ from "lodash";

export function attributes({ hull }) {
  return hull.get('/search/user_reports/bootstrap')
  .then(data => _.filter(_.reduce(data.tree, (att, group) => {
    att.push(..._.map(group.children, "id"));
    return att;
  }, []), att => !!att));
}

//   return hull.post("search/user_reports", params)

//   .then((args) => {
//     const { pagination = {}, data = [] } = args;
//     const [user] = data;
//     if (!user || !user.id) return Promise.reject({ message: "User not found!" });

//     const q = [hull.as(user.id).get("/me/segments")];
//     if (eventSearch) {
//       const eventParams = (search.rest) ? queries.filteredEvents(user.id, search.rest) : queries.events(user.id);
//       hull.logger.debug("event.search", eventParams);
//       q.push(hull.post("search/events", eventParams));
//     }
//     return Promise.all(q)
//     .then(([segments, events = {}]) => {
//       if (eventSearch && !events.data.length) return { message: `\n Couldn't find "${search.rest}" events for ${user.name} - Search is case-sensitive` };

//       if (!user) return { message: `Couldn't find anyone!` };

//       const groupedUser = hull.utils.groupTraits(_.omitBy(user, v => (v === null || v === "" || v === undefined)));
//       return { user: groupedUser, events: events.data, segments, pagination };
//     }, (err) => { return { message: `An error occured ${err.message}!` }; }
//     , (err) => { return { message: `An error occured ${err.message}!` }; }
//     );
//   });
// };
