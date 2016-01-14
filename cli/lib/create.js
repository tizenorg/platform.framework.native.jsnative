(function() {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var Q = require('q');
  var format = require('string-template');

  var JsnError = require('./jsn_error');
  var shellUtil = require('./shell_util');

  module.exports = create;

  function create(argv, parser) {
    var manifestFile = 'tizen-manifest.xml';
    var iconFile = 'icon.png';

    return Q.fcall(function() {
      if (argv.args_[0] === undefined || argv.args_[1] === undefined) {
        throw new JsnError('error: You should type proper parameters');
      } else {
        var createType = argv.args_[0];
        console.log('Creating %s...', createType);

        switch (createType) {
          case 'package':
          var pkgId = argv.args_[1];
          return createPackage(pkgId, parser);

          case 'app':
          var appId = argv.args_[1];
          return createApp(appId, parser);

          default:
          throw new JsnError('error: You should type proper parameters');
        }
      }
    });

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
      var dirToCreate = path.join(parser.get('exec_path'), pkgId);

      // Checking directory to create package

      /**
        * if the dir exists and the dir is not empty, exit program
        * if the dir exists and the dir is empty, pass
        * if the dir exists and the dir is file, exit program
        * if there is no dir, create the dir
        */
      return Q.denodeify(fs.stat)(dirToCreate)
      .then(
        function(stats) {
          if (stats.isDirectory()) {
            return Q.denodeify(fs.readdir)(dirToCreate)
              .then(function(files) {
                if (files.length > 0)
                  throw new JsnError(pkgId + ' is not empty directory');
              });
          } else {
            throw new JsnError(pkgId + ' file exists.');
          }
        },
        function() {
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
      .then(function() {
        // Creating a new jsn project package
        // Creating directories in project
        var shExecPromises = ['shared', 'bin', 'lib', 'res']
          .map(function(dir) {
            return 'mkdir ' + path.join(dirToCreate, dir);
          })
          .map(shellUtil.shExec);
        return Q.all(shExecPromises)
          .catch(function(reason) { throw new JsnError(reason); });
      })

      /**
        * creates a 'res' directory under 'shared' directory
        * [pkgid]/shared
        *               /res
        */
      .then(function() {
        // Creating directories in project/shared
        return Q.denodeify(fs.mkdir)(path.join(dirToCreate, 'shared', 'res'));
      })

      /**
        * copy icon from 'tizen-app-template'
        * [pkgid]/res
        *            /icon.png
        */
      .then(function() {
        // Copying icon
        var defaultIconPath = path.join('..', 'tizen-app-template', iconFile);
        var iconCmd = 'cp ' + defaultIconPath + ' ' +
                        path.join(dirToCreate, 'shared', 'res', iconFile);
        return shellUtil.shExec(iconCmd)
          .catch(function(reason) { throw new JsnError(reason); });
      })

      /**
        * creates manifest file from 'tizen-app-template'
        * [pkgid]/tizen-manifest.xml
        */
      .then(function() {
        // Creating manifest
        var oriManifest = path.join('..', 'tizen-app-template', manifestFile);
        return Q.denodeify(fs.readFile)(oriManifest);
      })
      .then(function(data) {
        var manifestContent = format(data.toString(), { pkgid: pkgId });
        var newManifest = path.join(parser.get('exec_path'),
                                      pkgId, manifestFile);
        return Q.denodeify(fs.writeFile)(newManifest, manifestContent)
          .thenResolve(newManifest);
      })

      .catch(function(err) {
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
      .catch(function(err) {
          throw new JsnError('Parsing manifest file has a problem: ' +
                             err.message);
      })

      .then(function() {
        // Creating a new appication
        // Checking whether the 'appId' exists
        var app = parser.getAppSync(appId);
        if (app) {
          throw new JsnError(appId + ' already exists');
        }
      })

      // add 'ui-application' element in manifest file
      .then(function() {
        // Addding <ui-application> element in manifest file
        return parser.addUiAppInManifest(appId)
          .catch(function(err) { throw err; });
      })

      /**
        * creates a bin file by copying and editing it
        * [pkgid]/bin(dir)
        *                 /[pkgid].[appid]
        */
      .then(function() {
        // Creating bin file
        var defaultBinPath =
            path.join('..', 'tizen-app-template', 'pkgid.appid');
        return Q.denodeify(fs.readFile)(defaultBinPath)
          .then(function(data) {
            // edit format string by 'string-format'
            var binContent = format(data.toString(), { appid: appId });
            var binPath = path.join(parser.get('exec_path'), 'bin',
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
      .then(function() {
        // Creating app directory
        var appDir = path.join(parser.get('exec_path'), 'res', appId);
        return Q.denodeify(fs.mkdir)(appDir);
      })
      .then(function() {
        // Creating index.js
        var defaultIndexPath =
            path.join('..', 'tizen-app-template', 'index.js');
        return Q.denodeify(fs.readFile)(defaultIndexPath)
          .then(function(data) {
            // edit format string by 'string-format'
            var indexContent = format(data.toString(), { appid: appId });
            var indexPath =
                path.join(path.join(parser.get('exec_path'), 'res', appId),
                          'index.js');
            return Q.denodeify(fs.writeFile)(indexPath, indexContent,
                                            { mode: 0o775 });
          });
      })

      .catch(function(err) {
        throw new JsnError('Creating app(' + appId + ') is failed: ' +
                           err.message);
      });
    } // createApp
  } // create
}());
