'use strict'

const fs = require('fs');
const path = require('path');
const Q = require('q');

const JsnError = require('./jsn_error');
const shellUtil = require('./shell_util');

module.exports = sign;

/**
  * Sign command should be executed before build command.
  * If you execute sign command after build command, the sign command
  * deletes the tpk file which created by build command.
  */
function sign(argv, parser) {
  const argc = argv.args_.length;
  const signCmdArray = [];    // it will be used as command

  return Q.fcall(() => {
    // if argc is not 11, argc's num is equal or greater than 7 minimally
    if (argc !== 7 && argc !== 11) {
      throw new JsnError(
          'error: You should type sign command with proper arguments');
    }
  })

  .then(() => {
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
    const targetDir = parser.get('exec_path');
    const signer = argv.args_[0];
    const authorCAPath = argv.args_[1];
    const authorP12Path = argv.args_[2];
    const authorPwd = argv.args_[3];
    const dist1P12Path = argv.args_[4];
    const dist1Pwd = argv.args_[5];
    const dist1CAPath = argv.args_[6];
    const dist2P12Path = argv.args_[7] || '" "';
    const dist2Pwd = argv.args_[8] || '" "';
    const dist2CAPath = argv.args_[9] || '" "';
    const dist2RootPath = argv.args_[10] || '" "';

    // verify arguments for sign command by checking wheter files exist
    let verifyArgv = [signer, targetDir, authorCAPath, authorP12Path,
                      dist1P12Path, dist1CAPath];
    if (argc === 11) {
      verifyArgv =
          verifyArgv.concat([dist2P12Path, dist2CAPath, dist2RootPath]);
    }

    const promToExistFiles = verifyArgv.map(path => {
      const deferred = Q.defer();
      fs.stat(path, (err, stats) => {
        if (err) deferred.reject(err);
        else deferred.resolve(stats);
      });
      return deferred.promise;
    });

    return Q.all(promToExistFiles)
    .then(
      () => {
        let signArgv = [signer, targetDir, authorCAPath, authorP12Path,
                        authorPwd, dist1P12Path, dist1Pwd, dist1CAPath];
        if (argc === 7) {
          signArgv = signArgv.concat([dist2P12Path, dist2Pwd,
                                      dist2CAPath, dist2RootPath]);
        }
        Array.prototype.push.apply(signCmdArray, signArgv);
      }, err => {
      throw new JsnError('Can\'t verify arguments: ' + err.message);
    })
  })

  .then(() => parser.parse())
  .catch(err => {
      throw new JsnError('Parsing manifest file has a problem: ' +
                         err.message);
  })

  /**
    * if [*.tpk, author-signature.xml, .manifest.tmp, signature1.xml]
    * exists, remove all of them
    */
  .then(() => {
    console.log('Signing package...');
    // Checking previous signing
    const shExecPromises = ['*.tpk', 'author-signature.xml',
                            '.manifest.tmp', 'signature1.xml']
        .map(dir => ('rm ' + path.join(parser.get('exec_path'), dir)))
        .map(shellUtil.shExec);
    return Q.all(shExecPromises)
      // If above file doesn't exist, it can fail. But it needs to pass.
      .fail(() => {});
  })

  // try signing
  .then(() => {
    // Trying signing from 'signCmdArray[0]'
    const signCmd = signCmdArray.join(' ');
    return shellUtil.shExec(signCmd)
    .catch(function() { throw new JsnError("Fail to sign packge");
  });
  });
}