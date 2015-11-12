'use strict'

const fs = require('fs');
const path = require('path');
const Q = require('q');
const format = require('string-template');

const JsnError = require('./jsn_error');
const shellUtil = require('./shell_util');

module.exports = create;

function create(argv, parser) {
  console.log('<create>');

  const manifestFile = 'tizen-manifest.xml';
  const iconFile = 'icon.png';

  return Q.fcall(() => {
    if (argv.args_[0] === undefined || argv.args_[1] === undefined) {
      throw new JsnError('You should type proper parameters');
    } else {
      const createType = argv.args_[0];
      console.log('Create Type: %s', createType);

      switch (createType) {
        case 'package':
        const pkgId = argv.args_[1];
        return createPackage(pkgId, parser);

        case 'app':
        const appId = argv.args_[1];
        return createApp(appId, parser);

        default:
        throw new JsnError('You should type proper parameters');
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
    console.log('Creating Package');
    console.log(parser.get('exec_path'));
    const dirToCreate = path.join(parser.get('exec_path'), pkgId);

    console.log('Checking directory to create package');

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
        console.log(dirToCreate + ' isn\'t existed');
        console.log('Generating a new package dir : %s', dirToCreate);
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
      console.log('Creating a new jsn project package');
      console.log('Creating directories in project');
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
      console.log('Creating directories in project/shared');
      return Q.denodeify(fs.mkdir)(path.join(dirToCreate, 'shared', 'res'));
    })

    /**
      * copy icon from 'tizen-app-template'
      * [pkgid]/res
      *            /icon.png
      */
    .then(() => {
      console.log('Copying icon');
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
      console.log('Creating manifest');
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
    console.log('createApp');

    return parser.parse()
    .catch(err => {
        throw new JsnError('Parsing manifest file has a problem: ' +
                           err.message);
    })

    .then(() => {
      console.log('Creating a new appication.');
      console.log('Checking whether the app(%s) exists', appId);
      const app = parser.getAppSync(appId);
      if (app) {
        throw new JsnError(appId + " already existed");
      }
    })

    // add 'ui-application' element in manifest file
    .then(() => {
      console.log('Addding <ui-application> element in manifest file');
      return parser.addUiAppInManifest(appId)
        .catch(err => { throw err; });
    })

    /**
      * creates a bin file by copying and editing it
      * [pkgid]/bin(dir)
      *                 /[pkgid].[appid]
      */
    .then(() => {
      console.log('Creating bin file');
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
      console.log('Creating app directory');
      const appDir = path.join(parser.get('exec_path'), 'res', appId);
      return Q.denodeify(fs.mkdir)(appDir);
    })
    .then(() => {
      console.log('Creating index.js');
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
