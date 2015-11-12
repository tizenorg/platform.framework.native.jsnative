'use strict'

const path = require('path');
const Q = require('q');

const shellUtil = require('./shell_util');
const JsnError = require('./jsn_error');

module.exports = function(argv, parser) {
  const appId = argv.args_[0];

  return Q.fcall(() => {
    if (appId === undefined)
      throw new JsnError('You should type appid');

    return parser.parse()
    .catch(err => {
      throw new JsnError('Parsing manifest file has a problem: ' +
                         err.message);
    })
  })

  .then(() => {
    console.log('Removing an app');
    if (parser.get('parsed') && parser.get('has_app')) {
      const app = parser.getAppSync(appId);
      if (app === null) {
        throw new JsnError('There is no app');
      }

      console.log('Deleting directories & files');
      const execFileInBin = path.join(parser.get('exec_path'),
                                      'bin', app.exec);
      const appDirInRes = path.join(parser.get('exec_path'),
                                    'res', app.app_id);
      const shPromises = ['rm ' + execFileInBin, 'rm -rf ' + appDirInRes]
                         .map(shellUtil.shExec);
      return Q.all(shPromises);
    } else {
      throw new JsnError('There is no app');
    }
  })

  .then(() => {
    console.log('Deleting ui-application element in manifest file');
    return parser.removeApp(appId)
      .then(() => console.log('Done to remove ' + appId));
  });
};
