var _ = require('lodash'),
    fs = require('fs'),
    async = require('async'),
    Pipeline = require('node-pipeline'),
    mixdown = require('mixdown-server'),
    wrench = require('wrench'),
    path = require('path'),
    util = require('util'),
    MockRequest = require('hammock').Request,
    MockResponse = require('hammock').Response;

/** 
* Creates a pipeline with steps that will make a request to a router with a mock req/res 
* then send back the output from response.
**/ 
var newPipeline = function() {
    var plExport = Pipeline.create('Export mixdown resources');

    plExport.use(function(results, next) {
        var options = results[0],
            app = options.app, 
            host = options.host || app.config.hostmap[0],
            destination = options.destination;

        // enumerate the urls
        _.each(options.urls, function(url) {
            var src = url.src,
                filepath = destination + (url.dest || url.src);

            // enqueue a pipeline step for this url.
            plExport.use(function(results, next) {
                var req = new MockRequest({
                        url: src,
                        headers: { host: host }
                    }),
                    res = new MockResponse(),
                    router = app.plugins.router();

                // listen for res.end()
                res.on('end', function(errResponse, data) {

                    if (errResponse) {
                        console.log('ERROR: ' + errResponse);
                    }

                    // TODO: write data.body to the dest.
                    var dir = filepath.replace(/\/([^/]*)$/, '');

                    wrench.mkdirSyncRecursive(dir, 0777);
                    fs.writeFile(filepath, data.body, function(errWrite) {
                        next(errWrite, data);
                    });

                });

                router.on('error', function(err) {});

                router.dispatch(req, res);
            }, 'Export ' + src + ' to ' + filepath);

        });

        next();
    }, "Parse urls and create export tasks");

    return plExport;
};

module.exports = function(grunt) {

  // Create a new task.
  grunt.registerMultiTask('mixdown-publish', 'Export mixdown resources', function() {
    var options = this.data,
        done = this.async(),
        mixdownConfig = new mixdown.Config(grunt.file.readJSON(options.serverConfig));
        
    grunt.log.writeln(util.inspect(this.data));

    // load env config and apply it
    try {
        mixdownConfig.env( grunt.file.readJSON(options.envConfig) );
    }
    catch (e) {
        grunt.log.writeln(util.inspect(e));
    }

    mixdownConfig.init();

    // add logger so that any plugins that rely on a logger will work.
    global.logger = mixdown.Logger.create( mixdownConfig.config.server.logger);

    grunt.log.writeln('mixdown configuration parsed');

    var plConfigs = _.map(options.apps, function(a) { 
                                    return _.extend(a, { 
                                        app: mixdownConfig.apps[a.name], 
                                        destination: options.destination 
                                    });
                                }),
        plTasks = _.map(plConfigs, function(plConfig) {
            return function(cb) {

                // create pipeline instance, attach callback hook for async to end, execute
                var pl = newPipeline();
                pl.on('step', function(name, action) {
                    grunt.log.writeln([pl.name, name].join(': '));
                })
                .on('error', function() {})
                .on('end', cb)
                .execute(plConfig);
            }
        });

    grunt.log.writeln(util.inspect(plConfigs));

    async.parallel(plTasks, function(err) {
        grunt.log.writeln(util.inspect(err));
        done(err === null);
    });

  });

};