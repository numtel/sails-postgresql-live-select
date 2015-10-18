# sails-postgresql-live-select [![Build Status](https://travis-ci.org/numtel/sails-postgresql-live-select.svg?branch=master)](https://travis-ci.org/numtel/sails-postgresql-live-select)

A [Sails](http://sailsjs.org) connection adapter to use [the `pg-live-select` NPM Package](https://github.com/numtel/pg-live-select) in order to provide live (real time) result sets for models.

## Example

See the [chat room example application](https://github.com/numtel/sails-postgresql-live-select-chat-example) for a full working demonstration of this package.

## Installation

To be used alongside the [`sails-postgresql` connection adapter](https://github.com/balderdashy/sails-postgresql).

1. Install the package:

    ```bash
    npm install --save sails-postgresql-live-select
    ```

2. Add the connection settings to your `config/connections.js`:

    ```javascript
    livePg: {
      adapter: 'sails-postgresql-live-select',
      // Connection details must be passed as url, not individually
      url: 'postgres://sails:sails@localhost:5432/sails_test',
      // Unique channel required for asynchronous notifications
      channel: 'sails_test'
    }
    ```

3. Add the adapter to be used on your models, for example in `config/models.js`:

    ```javascript
      connection: [ 'postgresql', 'livePg' ],
    ```

## Usage

### YourModel.liveFind(options, [condition])

This adapter adds a `liveFind` method to your models.

Argument | Type | Description
----------|------|-----------
`options` | Object | Find options as defined by [Waterline Query Language](http://sailsjs.org/documentation/concepts/models-and-orm/query-language)
`condition` | Function | Optional function for validating if result set should be refreshed on row change. See [condition function documentation for pg-live-select](https://github.com/numtel/pg-live-select#trigger-object-definitions)

The `liveFind` method returns a [`SelectHandle` object as defined by pg-live-select](https://github.com/numtel/pg-live-select#selecthandle-class).

For example, listen for the `update` event in your controller actions to send changes to the client:

```javascript
var myLiveSelect = MyModel.liveFind({},
  function(row) {
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

When done listening for updates to a query, be sure to call the `stop()` method on the returned `SelectHandle` object to prevent memory leaks.

## Running Tests

```bash
# Configure PostgreSQL server settings
vim test/config/connections.js
# Run suite
npm test
```

Test execution code is in [`test/config/bootstrap.js`](test/config/bootstrap.js).

## License

MIT
