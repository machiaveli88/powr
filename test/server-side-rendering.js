var should = require('chai').should(),
   path = require('path'),
   expect = require('chai').expect,
   supertest = require('supertest'),
   api = supertest('http://localhost:3000');
var Browser = require('zombie');
Browser.localhost('localhost', 3000);

describe('server side rendering', function() {
   var app;
   var browser = new Browser();

   before(function(done){
      this.timeout(15000);
      var powr = require('../server.js');
      var config = require('./fixtures/config.js')();
      app = powr.createApp(config);
      app.set('ssr', true);
      app.on("started", function(){
         done();
      });
      app.launch();
   });

   after(function(){
      app.set('ssr', false);
      app.server.close();
   });

   it('should return 404', function(done) {
      api.get('/abc')
         .set('Accept', 'application/html')
         .expect(404, done);
   });

   it('should return rendered template', function(done) {
      browser.visit('/', function(){
         //console.log('Text', browser.elements('#app').html());
         //browser.assert.element('#app div');
         browser.assert.text('#app div', 'Hi!');
         done();
      });
   });
});
