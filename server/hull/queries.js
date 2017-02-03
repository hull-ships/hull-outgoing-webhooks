export function latest() {
  return {
    query: {
      match_all: {}
    },
    sort: {
      created_at: "asc"
    },
    raw: true,
    page: 1,
    per_page: 1
  };
}

export function id(query) {
  return {
    filter: {
      filtered: {
        query: { match_all: {} },
        filter: { and: { filters: [{ terms: { id: [query] } }] } }
      }
    },
    sort: {
      created_at: "asc"
    },
    raw: true,
    page: 1,
    per_page: 1
  };
}
export function email(query) {
  return {
    query: {
      multi_match: {
        type: "phrase_prefix",
        query,
        operator: "and",
        fields: ["email.exact^2"]
      }
    },
    sort: {
      created_at: "asc"
    },
    raw: true,
    page: 1,
    per_page: 1
  };
}
export function events(user_id) {
  return {
    filter: {
      has_parent: {
        type: "user_report",
        query: { match: { id: user_id } }
      }
    },
    sort: { created_at: "desc" },
    raw: true,
    page: 1,
    per_page: 15
  };
}
export function eventId(i) {
  return {
    filter: {
      ids: {
        values: [i],
        type: "event"
      }
    },
    sort: {
      created_at: "desc"
    },
    raw: true,
    page: 1,
    per_page: 100
  };
}
