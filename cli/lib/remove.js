(function() {
  'use strict';

  var path = require('path');
  var Q = require('q');

  var shellUtil = require('./shell_util');
  var JsnError = require('./jsn_error');

  module.exports = function(argv, parser) {
    var appId = argv.args_[0];

    return Q.fcall(function() {
      if (appId === undefined)
        throw new JsnError('error: You should type appid');

      return parser.parse()
      .catch(function(err) {
        throw new JsnError('Parsing manifest file has a problem: ' +
                           err.message);
      });
    })

    .then(function() {
      console.log('Removing app...');
      if (parser.get('parsed') && parser.get('has_app')) {
        var app = parser.getAppSync(appId);
        if (app === null) {
          throw new JsnError('There is no app');
        }

        // Deleting directories & files
        var execFileInBin = path.join(parser.get('exec_path'),
                                        'bin', app.exec);
        var appDirInRes = path.join(parser.get('exec_path'),
                                      'res', app.app_id);
        var shPromises = ['rm ' + execFileInBin, 'rm -rf ' + appDirInRes]
                           .map(shellUtil.shExec);
        return Q.all(shPromises);
      } else {
        throw new JsnError('There is no app');
      }
    })

    .then(function() {
      // Deleting ui-application element in manifest file
      return parser.removeApp(appId);
    });
  };
}());