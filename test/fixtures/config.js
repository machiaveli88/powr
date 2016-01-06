// Config values
var path = require("path");
require("babel-core/register")({
   stage: 0,
   only: __dirname
});

module.exports = function () {
   return {
      id: "powr-test",
      name: "Powr Test Application",
      entry: path.resolve(__dirname, 'app.js'),
      templates: path.resolve(__dirname, 'templates'),
      port: process.env.PORT || 3000,
      url: DEBUG ? ("http://localhost:" + (process.env.PORT || 3000)) : 'https://powr.herokuapp.com',
      cache: {
         minutes: 0
      },
      secret: "keyboardcat123",
      mailjet: {
         key: 'xyz',
         secret: 'xyz',
         from: 'xyz'
      },
      database: {
         storage: path.resolve(__dirname, 'data.db')
      },
      recaptcha: {
         secret: "xyz",
         site: "xyz",
         options: {
            /*theme: "dark"*/
         }
      },
      upload: {
         uploadDir: "/uploads",
         urlUpload: "/upload",
         urlDownload: "/dl",
         cloudinary: {
            cloud_name: 'xyz',
            api_key: 'xyz',
            api_secret: 'xyz',
            folder: "etgh"
         }
      }
   }
}
