var should = require('chai').should(),
   path = require('path'),
   expect = require('chai').expect,
   supertest = require('supertest'),
   api = supertest('http://localhost:3000');

describe('server basic functions', function() {
   var app;

   before(function(done){
      this.timeout(15000);
      var powr = require('../server.js');
      var config = require('./fixtures/config.js')();
      app = powr.createApp(config);
      done();
   });

   after(function(){
      app.server.close();
   });

   it('should emit hooks', function(done) {
      var launchBefore = false, launch = false, launchAfter = false;
      var bindModelsBefore = false, bindModels = false, bindModelsAfter = false;

      app.before("bind:models", function(){
         bindModelsBefore = true;
      });
      app.on("bind:models", function(){
         bindModels = true;
      });
      app.after("bind:models", function(){
         bindModelsAfter = true;
      });
      app.before("launch", function(){
         launchBefore = true;
      });
      app.on("launch", function(){
         launch = true;
      });
      app.after("launch", function(){
         launchAfter = true;
      });
      app.on("started", function(){
         expect(launchBefore).to.ok;
         expect(launch).to.ok;
         expect(launchAfter).to.ok;
         expect(bindModelsBefore).to.ok;
         expect(bindModels).to.ok;
         expect(bindModelsAfter).to.ok;
         done();
      });
      app.launch();
   });

   it('should output "hi"', function(done) {
      var log = require('../index.js').log('test/server');
      log('hi');
      done();
   });

   it('should get ok status', function(done) {
      api.get('/__status')
         .set('Accept', 'application/json')
         .expect(200, {
            status: 'ok'
         }, done);
   });
});
