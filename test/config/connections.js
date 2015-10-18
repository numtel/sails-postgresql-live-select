if(process.env.CI) {
  // Travis CI test settings
  module.exports.connections = {
    pg: {
      adapter: 'sails-postgresql',
      url: 'postgres://postgres@127.0.0.1/travis_ci_test'
    },
    livePg: {
      adapter: 'sails-postgresql-live-select',
      url: 'postgres://postgres@127.0.0.1/travis_ci_test',
      channel: 'travis_test'
    }
  };

} else {
  // Tests running locally, configure these values
  module.exports.connections = {
    pg: {
      adapter: 'sails-postgresql',
      url: 'postgres://sails:sails@localhost:5432/sails_test'
    },
    livePg: {
      adapter: 'sails-postgresql-live-select',
      // Connection details must be passed as url, not individually
      url: 'postgres://sails:sails@localhost:5432/sails_test',
      // Unique channel required for asynchronous notifications
      channel: 'sails_test'
    }
  };
}
