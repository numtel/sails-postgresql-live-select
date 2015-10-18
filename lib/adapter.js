/*---------------------------------------------------------------
  :: sails-postgresql-live-select
  -> adapter
---------------------------------------------------------------*/

// Dependencies
var _ = require('lodash');
var LivePg = require('pg-live-select');

var Errors = require('waterline-errors').adapter;
var Sequel = require('waterline-sequel');

// Hack for development - same as sails-mysql
var log = (process.env.LOG_QUERIES === 'true') ? console.log : function () {};

module.exports = (function() {

  // Keep track of all the connections
  var connections = {};

  // Connection specific overrides from config
  var connectionOverrides = {};

  // Instance of LivePg, to be initialized on registration
  var liveConnection = null;

  var sqlOptions = {
    parameterized: true,
    caseSensitive: true,
    escapeCharacter: '"',
    casting: true,
    canReturnValues: true,
    escapeInserts: true,
    declareDeleteAlias: false
  };

  var adapter = {

    defaults: {
      channel: 'sails_live_select'
    },

    // Register a new DB Connection
    registerConnection: function(connection, collections, cb) {

      var self = this;

      if(!connection.identity) return cb(Errors.IdentityMissing);
      if(connections[connection.identity]) return cb(Errors.IdentityDuplicate);

      // Store any connection overrides
      connectionOverrides[connection.identity] = {};

      // Look for the WL Next key
      if(connection.hasOwnProperty('wlNext')) {
        connectionOverrides[connection.identity].wlNext = _.cloneDeep(connection.wlNext);
      }

      // Build up a schema for this connection that can be used throughout the adapter
      var schema = {};

      _.each(_.keys(collections), function(coll) {
        var collection = collections[coll];
        if(!collection) return;

        var _schema = collection.waterline && collection.waterline.schema && collection.waterline.schema[collection.identity];
        if(!_schema) return;

        // Set defaults to ensure values are set
        if(!_schema.attributes) _schema.attributes = {};
        if(!_schema.tableName) _schema.tableName = coll;

        // If the connection names are't the same we don't need it in the schema
        if(!_.includes(collections[coll].connection, connection.identity)) {
          return;
        }

        // If the tableName is different from the identity, store the tableName in the schema
        var schemaKey = coll;
        if(_schema.tableName != coll) {
          schemaKey = _schema.tableName;
        }

        schema[schemaKey] = _schema;
      });

      // Store the connection
      connections[connection.identity] = {
        config: connection,
        collections: collections,
        schema: schema
      };

      // Open LivePg connection
      liveConnection = new LivePg(connection.url, connection.channel);
      
      cb();
    },


    teardown: function(connectionName, cb) {
      if(liveConnection !== null) {
        // Close binlog client connection on teardown
        liveConnection.cleanup(function() {
          liveConnection = null;
          cb();
        });
      } else {
        cb();
      }
    },

    // Synchronously return a LiveMysqlSelect object for a find query
    // @param condition Function Optionally, pass a data invalidation callback
    liveFind: function(connectionName, table, options, condition) {
      // Grab Connection Schema
      var schema = {};
      var connectionObject = connections[connectionName];
      var collection = connectionObject.collections[table];

      Object.keys(connectionObject.collections).forEach(function(coll) {
        schema[coll] = connectionObject.collections[coll].schema;
      });

      // Build Query
      var _schema = connectionObject.schema;

      // Mixin WL Next connection overrides to sqlOptions
      var overrides = connectionOverrides[connectionName] || {};
      var _options = _.cloneDeep(sqlOptions);
      if(overrides.hasOwnProperty('wlNext')) {
        _options.wlNext = overrides.wlNext;
      }

      var sequel = new Sequel(_schema, _options);
      var _query;

      // Build a query for the specific query strategy
      try {
        _query = sequel.find(table, options);
      } catch(e) {
        return cb(e);
      }

      // Start live query, return SelectHandle object
      log('PGSQL.liveFind: ', _query.query[0], _query.values[0]);

      var triggers = {};
      if(typeof condition === 'function') {
        triggers[table] = condition;
      }

      var liveSelect = liveConnection.select(
        _query.query[0], _query.values[0], triggers);
      
      return liveSelect;

    },

    identity: 'sails-postgresql-live-select'
  };



  return adapter;

})();

