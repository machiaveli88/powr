'use strict';

process.on('uncaughtException', function (err) {
   console.error(err, err.stack);
});

global.BROWSER = false;
global.SERVER = true;
global.STANDALONE = false;
global.ELECTRON = false;
global.PHONEGAP = false;
global.DEBUG = process.env.NODE_ENV !== "production";

process.env.DEBUG_COLORS = 1;
process.env.DEBUG_FD = 1;
process.env.DEBUG = process.env.DEBUG || "cryo*,app*,powr*";

// Return express instance
module.exports = function(config){
   var json = require('../package.json');
   console.log('Starting powr ' + json.version)
   return require("./express")(
      require("./config")(config)
   );
}
