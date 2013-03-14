module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    "mixdown-publish": {
      android: {
        destination: './tests/output',  
        serverConfig: './tests/fixtures/server.json',
        envConfig: "./tests/fixtures/server-android.json",
        apps: [{
          name: 'demo',
          urls: [
          {
            src: '/',
            dest: '/index.html'
          },
          {
            src: '/js/main.js'
          },
          {
            src: '/css/style.css'
          }]
        }]
      }
    }
  });

  // Add to your imports.
  grunt.loadTasks( './lib' );

  // Default task(s).
  grunt.registerTask('default', ['mixdown-publish']);

};