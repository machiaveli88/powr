var Sequelize = require("sequelize");
var log = require('cryo-utils/log')("db");

export default function (app, config) {
   var isEmbedded = !!config.storage;
   app.db = new Sequelize(config.db, config.username, config.password, {
      logging: config.log ? log : null,
      host: config.host,
      storage: config.storage,
      dialect: isEmbedded ? 'sqlite' : 'postgres',
      dialectOptions: {
         ssl: config.ssl === true
      },
      pool: {
         max: 5,
         min: 0,
         idle: 10000
      },
      define: {
         hooks: {
            beforeCreate: function (instance, options) {
               //log("BEFORE CREATE", this, instance, options);
            },
            afterCreate: function (instance, options) {
               //log("AFTER CREATE", this, instance, options);
            }
         }
      }
   });

   app.db.authenticate().then(function () {
      if(config.sync === true){
         app.db.sync({ force: true })
            .then(app.hook("db:sync", function() {
               log("Synced db");
               this.after();
            })).catch(log);
      }
   }).catch(function(err) {
      log("Err syncing db", err);
   });

   return app;
}
