module.exports = function getClientMock() {
  return {
    configuration: {},
    logger: {
      info: (msg, data) => console.log(msg, data),
      error: (msg, data) => console.log(msg, data),
      debug: (msg, data) => console.log(msg, data),
      log: (msg, data) => console.log(msg, data)
    },
    asUser: function asUser() {
      return this;
    },
    get: () => {
      return Promise.resolve({});
    },
    post: () => {
      return Promise.resolve({});
    },
    put: () => {
      return Promise.resolve({});
    }
  };
};
