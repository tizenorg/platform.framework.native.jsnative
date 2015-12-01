(function() {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var Q = require('q');

  var JsnError = require('./jsn_error');
  var shellUtil = require('./shell_util');

  module.exports = build;

  // this module's build is meanging to package a tpk
  function build(argv, parser) {
    var needToSign = argv.args_[0] || 'nosign';
    switch(needToSign) {
      case 'sign':
      // current args_[0] is 'sign'. So remove it.
      argv.args_.shift();
      return require('./sign')(argv, parser)
      .then(function() {packageToTpk();});

      case 'nosign':
      return parser.parse()
      .catch(function(err) {
        throw new JsnError('Parsing manifest file has a problem: ' +
                           err.message);
      })
      .then(function() {
        packageToTpk();
      });

      default:
      throw new JsnError('Wrong parameters for build command');
    }

    function packageToTpk() {
      var dotTpk = '.tpk';
      var dirToGoBack = process.cwd();

      console.log('Building the package...');

      // exist 'zip' command?
      return shellUtil.shExec('which zip')

      .then(function() {
        // cd to project directory
        process.chdir(parser.get('exec_path'));

        var pkgIdTpk = parser.get('package').pkg_id + dotTpk;

        // if *.tpk file exists, delete it
        return Q.denodeify(fs.stat)(pkgIdTpk)
          .then(function(stats) {
            shellUtil.shExec('rm ' + pkgIdTpk);
          },
            function() {
            // empty(if not, it is catrued by outer catch )
          });
      })

      .then(function() {
        var tpkFile = parser.get('package').pkg_id + dotTpk;
        var output = '.' + path.sep + tpkFile;
        var input = '.' + path.sep + '*';
        return shellUtil.shExec('zip -r ' + output + ' ' + input);
      })

      // cd to previous cwd; actually, doesn't need this
      .then(function() {
        process.chdir(dirToGoBack);
      });
    }
  }
}());