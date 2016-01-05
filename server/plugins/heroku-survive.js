export default function(app, url) {
    if (app.get('env') === 'production') {
        //server.use("/*", staticAsset(path.join('..', 'app', 'www')));
        // Heroku keep alive
        var http = require("http");
        setInterval(function () {
            var today = new Date().getHours();
            if (today <= 7 || today >= 23) {
                http.get(url);
            }
        }, 300000); // every 5 minutes (300000)
    }
}
