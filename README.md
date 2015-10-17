# sails-mysql-live-select [![Build Status](https://travis-ci.org/numtel/sails-mysql-live-select.svg?branch=master)](https://travis-ci.org/numtel/sails-mysql-live-select)

A [Sails](http://sailsjs.org) connection adapter to use [the `mysql-live-select` NPM Package](https://github.com/numtel/mysql-live-select) in order to provide live (real time) result sets for models.

## Example

See the [chat room example application](https://github.com/numtel/sails-mysql-live-select-chat-example) for a full working demonstration of this package.

## Installation

To be used alongside the [`sails-mysql` connection adapter](https://github.com/balderdashy/sails-mysql).

### MySQL server configuration

A MySQL server properly configured to output the binary log in `ROW` mode is required to use this adapter:

* Enable MySQL binlog in `my.cnf`, restart MySQL server after making the changes.

  ```
  # binlog config
  server-id        = 1
  binlog_format    = row
  log_bin          = /var/log/mysql/mysql-bin.log
  binlog_do_db     = employees   # optional
  expire_logs_days = 10          # optional
  max_binlog_size  = 100M        # optional
  ```
* Create an account with replication privileges:

  ```sql
  GRANT REPLICATION SLAVE, REPLICATION CLIENT, SELECT ON *.* TO 'user'@'localhost'
  ```

### Package installation

1. Install the package:

    ```bash
    npm install --save sails-mysql-live-select
    ```

2. Add the connection settings to your `config/connections.js`:

    ```javascript
      liveMysql: {
        adapter: 'sails-mysql-live-select',
        host: '127.0.0.1',
        // This user must have REPLICATION SLAVE, REPLICATION CLIENT and SELECT
        // privileges.
        user: 'USERNAME',
        password: 'PASSWORD',
        database: 'DATABASE',
        // Other settings used by mysql-live-select
        serverId: [Unique positive integer 1 - 2^32, default 1337]
        minInterval: [Minimum time in milliseconds between refresh]
      }
    ```

3. Add the adapter to be used on your models, for example in `config/models.js`:

    ```javascript
      connection: [ 'mysql', 'liveMysql' ],
    ```

## Usage

### YourModel.liveFind(options, [condition])

This adapter adds a `liveFind` method to your models.

Argument | Type | Description
----------|------|-----------
`options` | Object | Find options as defined by [Waterline Query Language](http://sailsjs.org/documentation/concepts/models-and-orm/query-language)
`condition` | Function | Optional function for validating if result set should be refreshed on row change. See [condition function documentation for mysql-live-select](https://github.com/numtel/mysql-live-select#condition-function)

The `liveFind` method returns a [`LiveMysqlSelect` object as defined by mysql-live-select](https://github.com/numtel/mysql-live-select#livemysqlselect-object).

For example, listen for the `update` event in your controller actions to send changes to the client:

```javascript
var myLiveSelect = MyModel.liveFind({},
  function(row, newRow, rowDeleted) {
    // Optional data invalidation callback
    // Check if data is invalidated by this row change
    console.log('Row data', row);
    return true;
  }
).on('update',
  function(diff, data) {
    // Results have changed, send to client
    sails.sockets.emit(req.socket.id, 'chatDiff', diff);
  }
);
```

When done listening for updates to a query, be sure to call the `stop()` method on the returned `LiveMysqlSelect` object to prevent memory leaks.

## Running Tests

```bash
# Configure MySQL server settings
vim test/config/connections.js
# Run suite
npm test
```

Test execution code is in [`test/config/bootstrap.js`](test/config/bootstrap.js).

## License

MIT
