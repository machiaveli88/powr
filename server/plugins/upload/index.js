var cloudinary = require('cloudinary')
var fs = require('fs');
var path = require("path");
var multiparty = require('multiparty');
var quantize = require('quantize');
//var crypto = require('crypto');

var log = require('cryo-utils/log')("server", "upload");

module.exports = function (app, config) {
   cloudinary.config(config.cloudinary);
   /*if(DEBUG){
      cloudinary.api.delete_resources_by_prefix("test/" + config.cloudinary.folder, function(result)  {
         log("Cloudinary cleared test/" + config.cloudinary.folder, result);
      });
   }*/

   if (DEBUG) {
      app.get("/upload-test", app.recaptchaOrAuth.redirect, function (req, res) {
         res.send(
            '<form action="/upload" method="post" enctype="multipart/form-data">' +
               'Datei:<br>' +
               '<input type="file" name="file" value="">' +
               '<br><br>' +
               '<input type="submit" value="Absenden">' +
            '</form>'
         );
      });
   }

   var request = require('request');
   app.get('/upload', app.isAuthenticated, function (req, res, next) {
      var url = cloudinary.utils.zip_download_url('ekgd');
      req.pipe(request(url, function (err, resp, body) {
         if(err){
            next(err);
         }
      })).pipe(res);
      //res.send({url: cloudinary.utils.zip_download_url('ekgd')});
   });

   app.post('/upload', app.recaptchaOrAuth.verify, function (req, res, next) {
      var model = app.db.model("file");
      //log(req);
      log("Uploading file ...");
      /////////////////////////////////////////
      var form = new multiparty.Form();

      // Listen for incoming parts of the form.
      form.on('part', function (part) {
         var name, stream;
         // var hash = crypto.createHash('md5');
         // hash.setEncoding('hex');

         // It's a field, not a file.
         if (part.filename == null) {
            part.resume();
            // It's a file.
         }
         else {
            name = part.filename;
            // hash.end();
            // log(hash.read());

            // Write file in upload dir.
            var stream = cloudinary.uploader.upload_stream(function (result) {
               log("Uploaded image");
               //log(result);
               var f = {
                  name: result.public_id,
                  original: part.filename,
                  height: result.height,
                  size: result.bytes,
                  url: result.secure_url,
                  type: result.resource_type,
                  mime: result.resource_type + "/" + result.format,
                  width: result.width,
                  userId: req.user ? req.user.id : null,
                  cloudinary: result,
                  colors: [],
                  colorsGoogle: [],
                  // hash: hash.read()
                  // tags: []
               };

               if (result.colors) {
                  var colors = quantize(result.colors.map(function(color){
                     return hexToRgb(color[0]);
                  }), 5).palette();
                  colors.map(function(color){
                     return rgbToHex(color);
                  }).forEach(function(color){
                     f.colors.push(color);
                  });
               }
               if(result.predominant){
                  result.predominant.google.forEach(function(color){
                     if(color[1] > 45 || (f.colorsGoogle.length <= 1 && color[1] > 30) || f.colorsGoogle.length === 0){
                        f.colorsGoogle.push(color[0]);
                     }
                  });
               }

               model.create(f).then(function(a) {
                  log("Persisted image");
                  return res.json(a);
               }).catch(next);
            }, {
               //public_id/folder: req.body.title, => Ordner/Kontext
               //phash: null, => hash, um ähnliche bilder zu matchen
               //image_metadata/exif: true => geodaten, datum, etc.
               //raw_convert: aspose => .pdf generation aus dokumenten
               folder: "test/ekgd",
               format: "jpg",
               colors: true,
               tags: ['ekgd']
            });

            // Display something when file finished to upload.
            /*part.on('end', function(err) {
             if (err) {
             console.log(err);
             } else {
             console.log("File " + name + " saved to disk.");
             }
             });*/

            // Pipe the part parsing stream to the file writing stream.
            part.pipe(stream);
         }
      });

      // End the request when something goes wrong.
      form.on('error', function (err) {
         next(err);
      });

      // Send success code if file was successfully uploaded.
      /*form.on('close', function() {
       return res.send(201, {
       success: true
       });
       });*/

      form.parse(req);
      //////////////////////////////////
   });
}
function hexToRgb(hex) {
   var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
   ] : null;
}
function componentToHex(c) {
   var hex = c.toString(16);
   return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(rgb) {
   return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}
