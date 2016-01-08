// Config values
var path = require("path");
/*require("babel-core/register")({
   stage: 0,
   only: __dirname
});*/

module.exports = function () {
   return {
      name: "powr-test",
      app: path.resolve(__dirname, 'app.js'),
      webpack: false
   }
}
