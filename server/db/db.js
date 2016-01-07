var Sequelize = require("sequelize");
var log = require('powr-utils/log')("db");

// Setup and sync sequelize
module.exports = function (app, config) {
   config = createConfig(config);
   app.db = new Sequelize(config.db, config.username, config.password, config);

   app.db.authenticate().then(function () {
      if (config.sync === true) {
         app.db.sync({force: true})
            .then(app.hook("db:sync", function () {
               log("Synced db");
               this.after();
            })).catch(log);
      }
   }).catch(function (err) {
      log("Err syncing db", err);
   });

   return app;
}

// Cleanup config
function createConfig(config){
   if (!config) {
      config = {};
   }
   if (!config.pool) {
      config.pool = {
         max: 5,
         min: 0,
         idle: 10000
      };
   }
   if (!config.dialectOptions && config.ssl) {
      config.dialectOptions = {
         ssl: true
      };
   }
   if (!config.logging && config.log) {
      config.logging = config.log;
   }
   if (!config.dialect) {
      config.dialect = 'sqlite';
   }
   if (!config.storage && config.dialect === 'sqlite') {
      config.storage = './data.db';
   }
   return config;
}
