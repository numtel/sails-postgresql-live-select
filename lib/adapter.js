/*---------------------------------------------------------------
  :: sails-mysql-live-select
  -> adapter
---------------------------------------------------------------*/

// Dependencies
var LiveMysql = require('mysql-live-select');

var Errors = require('waterline-errors').adapter;
var Sequel = require('waterline-sequel');

var _registerConnection = require('sails-mysql/lib/connections/register');

// Hack for development - same as sails-mysql
var log = (process.env.LOG_QUERIES === 'true') ? console.log : function () {};

module.exports = (function() {

  // Keep track of all the connections
  var connections = {};

  // Instance of LiveMysql, to be initialized on first request
  var liveConnection = null;

  var sqlOptions = {
    parameterized: false,
    caseSensitive: false,
    escapeCharacter: '`',
    casting: false,
    canReturnValues: false,
    escapeInserts: true
  };

  var adapter = {

    defaults: {
      serverId: 1337,
      minInterval: 200
    },

    registerConnection: _registerConnection.configure(connections),

    teardown: function(connectionName, cb) {
      if(liveConnection !== null) {
        // Close binlog client connection on teardown
        liveConnection.end();
        liveConnection = null;
      }
    },

    // Synchronously return a LiveMysqlSelect object for a find query
    // @param condition Function Optionally, pass a data invalidation callback
    liveFind: function(connectionName, collectionName, options, condition) {
      // Check if this is an aggregate query and that there is something to return
      if(options.groupBy || options.sum || options.average || options.min || options.max) {
        if(!options.sum && !options.average && !options.min && !options.max) {
          return cb(Errors.InvalidGroupBy);
        }
      }

      var connectionObject = connections[connectionName];
      var collection = connectionObject.collections[collectionName];

      // Build find query
      var schema = connectionObject.schema;
      var _query;

      var sequel = new Sequel(schema, sqlOptions);

      // Build a query for the specific query strategy
      try {
        _query = sequel.find(collectionName, options);
      } catch(e) {
        return cb(e);
      }

      if(liveConnection === null) {
        // Open LiveMysql connection if not yet open
        liveConnection = new LiveMysql(connectionObject.config);
      }

      // Start live query, return LiveMysqlSelect object
      log('MYSQL.liveFind: ', _query.query[0]);

      var liveSelect = liveConnection.select(_query.query[0], [ {
        table: schema[collectionName].tableName,
        condition: typeof condition === 'function' ? condition : undefined
      } ]);
      
      return liveSelect;

    },

    identity: 'sails-mysql-live-select'
  };



  return adapter;

})();

