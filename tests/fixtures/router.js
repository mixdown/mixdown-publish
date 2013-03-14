var plRouter = require('pipeline-router'),
    async = require('async'),
    fs = require('fs');

var Router = function() {};

/**
* Attaches an autos router plugin to an application.
*
**/ 
Router.prototype.attach = function (options) {
    var app = options.app,
        world = options.world || 'World';

    /**
    * Initializes the routes for this application
    *
    **/
    this.router = function() {
        var router = new plRouter();
       
        router.get('/', function(req, res) { 
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end('Hello ' + world)
        });
        
        router.get('/js/main.js', function(req, res) { 
            var ops = [];

            ops.push(function(cb) {
                fs.readFile(__dirname + '/js1.js', { encoding: 'utf8' }, cb);
            });

            ops.push(function(cb) {
                fs.readFile(__dirname + '/js2.js', { encoding: 'utf8' }, cb);
            });

            async.parallel(ops, function(err, results) {
                res.writeHead(200, { "Content-Type": "application/javascript" });
                res.write(results[0]);
                res.write(results[1]);
                res.end();
            });
        });

        router.get('/css/style.css', function(req, res) { 
            res.writeHead(200, { "Content-Type": "text/css" });
            fs.createReadStream(__dirname + '/style.css').pipe(res);
        });

        return router;
    };
};

module.exports = Router;