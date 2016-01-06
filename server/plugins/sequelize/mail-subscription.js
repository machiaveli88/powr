var Sequelize = require('sequelize');
var _ = require('lodash');

module.exports = function (sequelize, options) {
   if (!options) {
      options = {};
   }
   if (options.UUID === undefined) {
      options.UUID = false;
   }
   var log = options.log || console.log;

   var mailjet = require ('node-mailjet').connect(options.key, options.secret);

   _.extend(sequelize.Model.prototype, {
      enableMailSubscriptions: function (property) {
         var Model = this;
         log('Enable mail-subscriptions on ' + this.name);
         this.fileTrackable = true;
         this.addHook('afterCreate', after);
         this.addHook('afterUpdate', after);
         this.addHook('afterDelete', afterDelete);
         return this;
      }
   });

   var afterDelete = function (instance, opt) {
   };

   var after = function (instance, opt) {
      var name = instance.get('name') || instance.get('title') || instance.get('subject');
      // Revision, Revision-Changes, Text repräsentation, Link

      var link = {
         html: "<a href='http://google.de/search?q="+instance.get('id')+"'>Öffnen</a>"
      };
      var request = mailjet
         .post("send")
         .request({
            "FromEmail": "info@kniffler.com",
            "FromName": "EGKD Website",
            "Subject": "Veränderung an " + opt.model.name + ": " + name,
            "Text-part": "Änderungen an "+name+"\n" + JSON.stringify(instance.dataValues),
            "Html-part":"<h3>Änderungen an "+name+"</h3><br />" + JSON.stringify(instance.dataValues),
            "Recipients":[{"Email":"bkniffler@me.com"}],
            "Attachments":[{"Content-type":"text/plain","Filename":"test.txt","content":"VGhpcyBpcyB5b3VyIGF0dGFjaGVkIGZpbGUhISEK"}]
         });

      request
         .on('success', function (response, body) {
            log (response.statusCode, body);
         })
         .on('error', function (err, response) {
            log (response.statusCode, err);
         });
   };

   return {
      // Return defineModels()
      defineModels: function () {
         // Tag model
         var attributes = {
            email: { // z.B. hash der email
               type: Sequelize.TEXT
            },
            model: { // all, all except, certain
               type: Sequelize.TEXT
            },
            criteria: { // id, contains, isNew, published: true ...
               type: Sequelize.NUMBER
            }
         };
         if (options.UUID) {
            attributes.id = {
               primaryKey: true,
               type: Sequelize.UUID,
               defaultValue: Sequelize.UUIDV4
            };
         }
         var File = sequelize.define('mail-subscription', attributes);

         File.subscribe = function () {
            return new Promise(function (resolve, reject) {
               sequelize.query('SELECT url, COUNT(*) FROM "file-usages" GROUP BY url ORDER BY COUNT(*) DESC, url;').then(function(items){
                  resolve(items[0]);
               }).catch(function (err) {
                  reject(err);
               });
            });
         }
         return File;
      }
   }
}
