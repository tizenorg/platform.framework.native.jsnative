'use strict'

const fs = require('fs');
const path = require('path');
const Q = require('q');
const format = require('string-template');

const JsnError = require('./jsn_error');
const shellUtil = require('./shell_util');

module.exports = create;

function create(argv, parser) {
  const manifestFile = 'tizen-manifest.xml';
  const iconFile = 'icon.png';

  return Q.fcall(() => {
    if (argv.args_[0] === undefined || argv.args_[1] === undefined) {
      throw new JsnError('error: You should type proper parameters');
    } else {
      const createType = argv.args_[0];
      console.log('Creating %s...', createType);

      switch (createType) {
        case 'package':
        const pkgId = argv.args_[1];
        return createPackage(pkgId, parser);

        case 'app':
        const appId = argv.args_[1];
        return createApp(appId, parser);

        default:
        throw new JsnError('error: You should type proper parameters');
      }
    }
  })

  /**
    * creates directory to be below directory structure
    * [pkgid]/shared(dir)
    *              /res(dir)
    *       /bin(dir)
    *       /lib(dir)
    *       /res(dir)
    *           /icon.png(file)
    *        /tizen-manifest.xml(file)
    */
  function createPackage(pkgId, parser) {
    // Creating Package
    const dirToCreate = path.join(parser.get('exec_path'), pkgId);

    // Checking directory to create package

    /**
      * if the dir exists and the dir is not empty, exit program
      * if the dir exists and the dir is empty, pass
      * if the dir exists and the dir is file, exit program
      * if there is no dir, create the dir
      */
    return Q.denodeify(fs.stat)(dirToCreate)
    .then(
      stats => {
        if (stats.isDirectory()) {
          return Q.denodeify(fs.readdir)(dirToCreate)
            .then(files => {
              if (files.length > 0)
                throw new JsnError(pkgId + ' is not empty directory');
            });
        } else {
          throw new JsnError(pkgId + ' file exists.');
        }
      },
      () => {
        // Generating a new package dir : 'dirToCreate'
        return Q.denodeify(fs.mkdir)(dirToCreate);
    })

    /**
      * creates directories like below directory structure
      * [pkgid]/shared
      *        /bin
      *        /lib
      *        /res
      */
    .then(() => {
      // Creating a new jsn project package
      // Creating directories in project
      const shExecPromises = ['shared', 'bin', 'lib', 'res']
        .map(dir => 'mkdir ' + path.join(dirToCreate, dir))
        .map(shellUtil.shExec);
      return Q.all(shExecPromises)
        .catch(reason => { throw new JsnError(reason); });
    })

    /**
      * creates a 'res' directory under 'shared' directory
      * [pkgid]/shared
      *               /res
      */
    .then(() => {
      // Creating directories in project/shared
      return Q.denodeify(fs.mkdir)(path.join(dirToCreate, 'shared', 'res'));
    })

    /**
      * copy icon from 'tizen-app-template'
      * [pkgid]/res
      *            /icon.png
      */
    .then(() => {
      // Copying icon
      const defaultIconPath = path.join('..', 'tizen-app-template', iconFile);
      const iconCmd = 'cp ' + defaultIconPath + ' ' +
                      path.join(dirToCreate, 'shared', 'res', iconFile);
      return shellUtil.shExec(iconCmd)
        .catch(reason => { throw new JsnError(reason); });
    })

    /**
      * creates manifest file from 'tizen-app-template'
      * [pkgid]/tizen-manifest.xml
      */
    .then(() => {
      // Creating manifest
      const oriManifest = path.join('..', 'tizen-app-template', manifestFile);
      return Q.denodeify(fs.readFile)(oriManifest);
    })
    .then(data => {
      const manifestContent = format(data.toString(), { pkgid: pkgId });
      const newManifest = path.join(parser.get('exec_path'),
                                    pkgId, manifestFile);
      return Q.denodeify(fs.writeFile)(newManifest, manifestContent)
        .thenResolve(newManifest);
    })

    .catch(err => {
        throw new JsnError('Creating package is failed: ' + err.message);
      });
  } // createPackage

  /**
    * creates directories to be below directory structure
    * [pkgid]/shared(dir)
    *               /res(dir)
    *        /bin(dir)
    *                 /[pkgid].[appid]
    *        /lib(dir)
    *        /res(dir)
    *                 /[appid]
    *                         /index.js
    *            /icon.png(file)
    *        /tizen-manifest.xml(file) - add 'ui-application' element
    */
  function createApp(appId, parser) {
    return parser.parse()
    .catch(err => {
        throw new JsnError('Parsing manifest file has a problem: ' +
                           err.message);
    })

    .then(() => {
      // Creating a new appication
      // Checking whether the 'appId' exists
      const app = parser.getAppSync(appId);
      if (app) {
        throw new JsnError(appId + " already exists");
      }
    })

    // add 'ui-application' element in manifest file
    .then(() => {
      // Addding <ui-application> element in manifest file
      return parser.addUiAppInManifest(appId)
        .catch(err => { throw err; });
    })

    /**
      * creates a bin file by copying and editing it
      * [pkgid]/bin(dir)
      *                 /[pkgid].[appid]
      */
    .then(() => {
      // Creating bin file
      const defaultBinPath =
          path.join('..', 'tizen-app-template', 'pkgid.appid');
      return Q.denodeify(fs.readFile)(defaultBinPath)
        .then(data => {
          // edit format string by 'string-format'
          const binContent = format(data.toString(), { appid: appId });
          const binPath = path.join(parser.get('exec_path'), 'bin',
                                    parser.get('package').pkg_id +
                                      '.' + appId);
          return Q.denodeify(fs.writeFile)(binPath, binContent,
                                           { mode: 0o775 });
        });
    })

    /**
      * creates directory and file
      * [pkgid]/res(dir)
      *                 /[appid]
      *                         /index.js
      */
    .then(() => {
      // Creating app directory
      const appDir = path.join(parser.get('exec_path'), 'res', appId);
      return Q.denodeify(fs.mkdir)(appDir);
    })
    .then(() => {
      // Creating index.js
      const defaultIndexPath =
          path.join('..', 'tizen-app-template', 'index.js');
      return Q.denodeify(fs.readFile)(defaultIndexPath)
        .then(data => {
          // edit format string by 'string-format'
          const indexContent = format(data.toString(), { appid: appId });
          const indexPath =
              path.join(path.join(parser.get('exec_path'), 'res', appId),
                        'index.js');
          return Q.denodeify(fs.writeFile)(indexPath, indexContent,
                                          { mode: 0o775 });
        });
    })

    .catch(err => {
      throw new JsnError('Creating app(' + appId + ') is failed: ' +
                         err.message);
    });
  } // createApp
} // create
