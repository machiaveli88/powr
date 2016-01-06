// Set globals and proces.env vars
var path = require('path');

module.exports = function (_globals, _env) {
   var globals = {
      ROOT: path.resolve(__dirname, '..'),
      BROWSER: false,
      SERVER: true,
      STANDALONE: false,
      ELECTRON: false,
      // Für Electron URL="localhost:3000" (siehe electron.html), local aber ""
      PHONEGAP: false,
      DEBUG: process.env.NODE_ENV !== "production"
   }

   var env = {
      DEBUG: process.env.DEBUG || "cryo*,app*",
      DEBUG_COLORS: 1,
      DEBUG_FD: 1
   }

   copyTo(globals, global);
   copyTo(_globals, global);
   copyTo(env, process.env);
   copyTo(_env, process.env);
}
function copyTo(source, target){
   if(!source || !target) return;
   for (var key in source) {
      target[key] = source[key];
   }
}
