var should = require('chai').should(),
   path = require('path'),
   expect = require('chai').expect,
   supertest = require('supertest'),
   api = supertest('http://localhost:3000');

describe('client side rendering', function() {
   var app;

   before(function(done){
      this.timeout(15000);
      var powr = require('../server.js');
      var config = require('./fixtures/config.js')();
      app = powr.createApp(config);
      app.on("started", function(){
         done();
      });
      app.launch();
   });

   after(function(){
      app.server.close();
   });

   it('should return an empty template', function(done) {
      api.get('/')
         .set('Accept', 'application/html')
         .expect(200, done);
   });

   it('should not return 404', function(done) {
      api.get('/a')
         .set('Accept', 'application/html')
         .expect(200, done);
   });
});
