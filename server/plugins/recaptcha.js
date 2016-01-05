var recaptcha = require('express-recaptcha');

export default function(app, config) {
   /*https://www.google.com/recaptcha/admin#list*/
   recaptcha.init(config.site, config.secret, config.options);
   app.recaptcha = recaptcha.middleware;
   app.recaptchaOrAuth = {
      render: function(req, res, next){
         if(!req.user){
            req.recaptcha = recaptcha.render();
         }
         next();
      },
      redirect: function(req, res, next){
         if(req.user){
            next();
         }
         else if(req.session && req.session.human){
            next();
         }
         else{
            res.redirect("/recaptcha-test?next=/upload")
         }
      },
      verify: function(req, res, next){
         if(req.user){
            next();
         }
         else if(req.session && req.session.human){
            next();
         }
         else{
            next(new Error("Proove that you're human"));
         }
         /*else {
            console.log(req);
            recaptcha.verify(req, function(error){
               if(error){
                  next(new Error(error));
               }
               else{
                  next();
               }
            });
         }*/
      }
   }

   if(DEBUG){
      app.get("/recaptcha-test", app.recaptcha.render, function(req, res){
         res.send(
            '<form action="/recaptcha-test" method="post">' +
               req.recaptcha +
               '<br><br>' +
               '<input type="submit" value="Absenden">' +
            '</form>'
         );
      });

      app.post("/recaptcha-test", app.recaptcha.verify, function(req, res, next){
         if (!req.recaptcha.error){
            req.session.human = true;
            req.session.save(function(){
               res.json( { valid: true });
            });
         }
         else{
            next(new Error(req.recaptcha.error));
         }
      });
   }
}
