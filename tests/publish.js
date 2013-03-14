var tap = require('tap'),
    test = tap.test,
    fs = require('fs'),
    childProcess = require('child_process'),
    async = require('async');

var validateOutput = function(filename, t, callback) {
    var ops = [];

    ops.push(function(cb) {
        fs.readFile('./expected/' + filename, 'utf8', cb);
    });

    ops.push(function(cb) {
        fs.readFile('./output/' + filename, 'utf8', cb);
    });

    async.parallel(ops, function(err, files) {
        var gold = files[0],
            out = files[1];

        t.ok(gold, filename + ": Gold should not be null");
        t.ok(out, filename + ": Out should not be null");

        t.equal(gold, out, filename + ": output should match gold.");
        callback();
    });
};

test("Test site export", function(t) {

    childProcess.exec(
        'grunt',
        {
            cwd: process.cwd()
        },
        function() {
            var tests = [];

            tests.push(function(cb) {
                validateOutput('css/style.css', t, cb);
            });

            tests.push(function(cb) {
                validateOutput('js/main.js', t, cb);
            });

            tests.push(function(cb) {
                validateOutput('index.html', t, cb);
            });

            async.parallel(tests, function(){
                t.end();
            });
        }
    );
});