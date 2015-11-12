'use strict'

const fs = require('fs');
const path = require('path');
const Q = require('q');

const JsnError = require('./jsn_error');
const shellUtil = require('./shell_util');

module.exports = build;

// this module's build is meanging to package a tpk
function build(argv, parser) {
  const needToSign = argv.args_[0] || 'nosign';
  switch(needToSign) {
    case 'sign':
    console.log('Build command will package with signing');

    // current args_[0] is 'sign'. So remove it.
    argv.args_.shift();
    return require('./sign')(argv, parser)
    .then(() => packageToTpk());

    case 'nosign':
    console.log('Build command will package without signing');
    return parser.parse()
    .catch(err => {
      throw new JsnError('Parsing manifest file has a problem: ' +
                         err.message);
    })
    .then(() => packageToTpk());

    default:
    throw new JsnError('Wrong parameters for build command: ' +
                       needToSign);
  }

  function packageToTpk() {
    const dotTpk = '.tpk';
    const dirToGoBack = process.cwd();

    console.log('Building the package');

    // exist 'zip' command?
    return shellUtil.shExec('which zip')

    .then(() => {
      // cd to project directory
      process.chdir(parser.get('exec_path'));

      const pkgIdTpk = parser.get('package').pkg_id + dotTpk;

      // if *.tpk file exists, delete it
      return Q.denodeify(fs.stat)(pkgIdTpk)
        .then(stats => shellUtil.shExec('rm ' + pkgIdTpk),
          () => {
          // empty(if not, it is catrued by outer catch )
        });
    })

    .then(() => {
      const tpkFile = parser.get('package').pkg_id + dotTpk;
      const output = '.' + path.sep + tpkFile;
      const input = '.' + path.sep + '*';
      return shellUtil.shExec('zip -r ' + output + ' ' + input);
    })

    // cd to previous cwd; actually, doesn't need this
    .then(() => process.chdir(dirToGoBack));
  }
}
