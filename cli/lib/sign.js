(function() {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var Q = require('q');

  var JsnError = require('./jsn_error');
  var shellUtil = require('./shell_util');

  module.exports = sign;

  /**
    * Sign command should be executed before build command.
    * If you execute sign command after build command, the sign command
    * deletes the tpk file which created by build command.
    */
  function sign(argv, parser) {
    var argc = argv.args_.length;
    var signCmdArray = [];    // it will be used as command

    return Q.fcall(function() {
      // if argc is not 11, argc's num is equal or greater than 7 minimally
      if (argc !== 7 && argc !== 11) {
        throw new JsnError(
            'error: You should type sign command with proper arguments');
      }
    })

    .then(function() {
      /**
        * argv.args_ are parameters for sign cmd
        * sign cmd:
        *     [signer] [targetDir] [authorCAPath] [authorP12Path] [authorPwd]
        *     [dist1P12Path] [dist1Pwd] [dist1CAPath]
        *     [dist2P12Path] [dist2Pwd] [dist2CAPath] [dist2RootPath]
        * if argc is not 11,
        *   fill them(11 - num of empty parameters) with ' ' (one space string)
        */

      // caution: targetDir is not from args_
      var targetDir = parser.get('exec_path');
      var signer = argv.args_[0];
      var authorCAPath = argv.args_[1];
      var authorP12Path = argv.args_[2];
      var authorPwd = argv.args_[3];
      var dist1P12Path = argv.args_[4];
      var dist1Pwd = argv.args_[5];
      var dist1CAPath = argv.args_[6];
      var dist2P12Path = argv.args_[7] || '" "';
      var dist2Pwd = argv.args_[8] || '" "';
      var dist2CAPath = argv.args_[9] || '" "';
      var dist2RootPath = argv.args_[10] || '" "';

      // verify arguments for sign command by checking wheter files exist
      var verifyArgv = [signer, targetDir, authorCAPath, authorP12Path,
                        dist1P12Path, dist1CAPath];
      if (argc === 11) {
        verifyArgv =
            verifyArgv.concat([dist2P12Path, dist2CAPath, dist2RootPath]);
      }

      var promToExistFiles = verifyArgv.map(function(path) {
        var deferred = Q.defer();
        fs.stat(path, function(err, stats) {
          if (err) deferred.reject(err);
          else deferred.resolve(stats);
        });
        return deferred.promise;
      });

      return Q.all(promToExistFiles)
      .then(
        function() {
          var signArgv = [signer, targetDir, authorCAPath, authorP12Path,
                          authorPwd, dist1P12Path, dist1Pwd, dist1CAPath];
          if (argc === 7) {
            signArgv = signArgv.concat([dist2P12Path, dist2Pwd,
                                        dist2CAPath, dist2RootPath]);
          }
          Array.prototype.push.apply(signCmdArray, signArgv);
        }, function(err) {
        throw new JsnError('Can\'t verify arguments: ' + err.message);
      });
    })

    .then(function() {
      parser.parse();
    })
    .catch(function(err) {
        throw new JsnError('Parsing manifest file has a problem: ' +
                           err.message);
    })

    /**
      * if [*.tpk, author-signature.xml, .manifest.tmp, signature1.xml]
      * exists, remove all of them
      */
    .then(function() {
      console.log('Signing package...');
      // Checking previous signing
      var shExecPromises = ['*.tpk', 'author-signature.xml',
                              '.manifest.tmp', 'signature1.xml']
          .map(function(dir) {
            return 'rm ' + path.join(parser.get('exec_path'), dir);
          })
          .map(shellUtil.shExec);
      return Q.all(shExecPromises)
        // If above file doesn't exist, it can fail. But it needs to pass.
        .fail(function() {});
    })

    // try signing
    .then(function() {
      // Trying signing from 'signCmdArray[0]'
      var signCmd = signCmdArray.join(' ');
      return shellUtil.shExec(signCmd)
      .catch(function() { throw new JsnError("Fail to sign packge");
    });
    });
  }
}());