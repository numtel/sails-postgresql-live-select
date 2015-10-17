if(process.env.CI) {
  // Travis CI test settings
  module.exports.connections = {
    mysql: {
      adapter: 'sails-mysql',
      host: '127.0.0.1',
      port: '3355',
      user: 'root',
      password: '',
      database: 'sails_test'
    },
    liveMysql: {
      adapter: 'sails-mysql-live-select',
      host: '127.0.0.1',
      port: '3355',
      user: 'root',
      password: '',
      database: 'sails_test',
      serverId: 1337,
      minInterval: 200
    }
  };

} else {
  // Tests running locally, configure these values
  module.exports.connections = {

    mysql: {
      adapter: 'sails-mysql',
      host: '127.0.0.1',
      user: 'todouser',
      password: 'todopass',
      database: 'sails_todo'
    },

    liveMysql: {
      adapter: 'sails-mysql-live-select',
      host: '127.0.0.1',
      // This user must have REPLICATION SLAVE, REPLICATION CLIENT and SELECT
      // privileges.
      user: 'todouser',
      password: 'todopass',
      database: 'sails_todo',
      // Other settings used by mysql-live-select
      serverId: 1337,
      minInterval: 200
    }
  };
}
