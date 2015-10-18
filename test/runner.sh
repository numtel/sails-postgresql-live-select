#!/bin/bash
cd ${0%/*}
cd ../node_modules
rm -f sails-postgresql-live-select
ln -s .. sails-postgresql-live-select
cd ../test
rm -f node_modules
ln -s ../node_modules node_modules
cd ..
node test/app.js
