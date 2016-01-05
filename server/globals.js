// Set globals and proces.env vars

module.exports = function (_globals, _env) {
   var globals = {
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

   if (!_globals) {
      _globals = {};
   }
   if (!_env) {
      _env = {};
   }
   for (var key in globals) {
      global[key] = globals[key];
   }
   for (var key in _globals) {
      global[key] = _globals[key];
   }
   for (var key in env) {
      process.env[key] = env[key];
   }
   for (var key in _env) {
      process.env[key] = _env[key];
   }
}
