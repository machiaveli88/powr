// Config values
var path = require("path");

module.exports = function(){
   return {
      port: process.env.PORT || 3000,
      //templates: path.resolve(global.ROOT, "app", "templates"),
      cache: {
         minutes: 0
      },
      secret: "keyboardcat",
      database: {},
      url: "http://localhost:"+(process.env.PORT || 3000)
   }
}
