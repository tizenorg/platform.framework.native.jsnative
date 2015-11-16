(function() {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var et = require('elementtree');
  var pd = require('pretty-data').pd;
  var Q = require('q');
  var format = require('string-template');

  var JsnError = require('./jsn_error');

  var MANIFEST_FILE = 'tizen-manifest.xml';

  function Parser(execPath) {
    this.exec_path = execPath;
    this.manifest_path = '';
    this.has_package = false;
    this.package = {};
    this.has_app = false;
    this.apps = [];

    // parsed_ expresses done to parse
    this.parsed = false;

    // ready_ expresses ready for parsing
    this.ready = (function(this_) {
      var maybeManifestPath = path.join(this_.exec_path,
                                          MANIFEST_FILE);
      var existManifest = (function(path) {
          try {
            return (fs.statSync(path));
          } catch(err) {
            return false;
          }
      })(maybeManifestPath);
      if (existManifest) {
        this_.manifest_path = maybeManifestPath;
        return true;
      } else {
        return false;
      }
    })(this);
  } // Parser

  Parser.prototype = {
    constructor: Parser,
    set: function(key, val) {
      this[key] = val;
    },

    get: function(key) {
      return this[key];
    },

    /**
      * parses manifest file and its contents are parsed to Parser's
      * members. this method returns a promise.
      */
    parse: function() {
      if (this.ready === false) {
        return Q.fcall(function() {
          throw new JsnError('\n  Parser is not ready. ' +
                             'Checks whether the manifest file exists');
        });
      }

      var self = this;
      return Q.denodeify(fs.readFile)(self.manifest_path)
      .then(function(data) {
        var etree = et.parse(data.toString());

        // parse package
        var manifestElem = etree.getroot();
        if (manifestElem) {
          var pack = {
            pkg_id: manifestElem.get('package'),
            pkg_version: manifestElem.get('version'),
            api_version: manifestElem.get('api-version')
          };
          self.package = pack;
          self.has_package = true;
        } else {
          throw new JsnError('Can\'t get manifest element ' +
                             'while parsing manifest file');
        }

        // parse apps
        var uiAppElems = etree.findall('./ui-application');
        if (uiAppElems) {
          var len = uiAppElems.length;
          self.has_app = (len > 0) ? true : false;
          for (var i = 0; i < len; i++) {
            var uiApp = uiAppElems[i];
            var app = {
              app_id: uiApp.get('appid'),
              exec: uiApp.get('exec'),
              type: uiApp.get('type')
            };
            self.apps[i] = app;
          }
        } else {
          throw new JsnError('Can\'t get any ui app elements ' +
                             'while parsing manifest file');
        }
        self.parsed = true;
      });
    }, // parse

    addUiAppInManifest: function(appId) {
      var self = this;
      return Q.denodeify(fs.readFile)(self.manifest_path)
      .then(function(data) {
        var etree = et.parse(data.toString());
        var subElement = et.SubElement;
        var root = etree.getroot();
        var uiAppElem = subElement(root, 'ui-application');
        uiAppElem.set('appid', appId);
        uiAppElem.set('exec', self.package.pkg_id + '.' + appId);
        uiAppElem.set('type', 'jsapp');
        uiAppElem.set('multiple', 'false');
        uiAppElem.set('taskmanage', 'true');
        uiAppElem.set('nodisplay', 'false');

        var iconElem = subElement(uiAppElem, 'icon');
        iconElem.text = 'icon.png';
        var labelElem = subElement(uiAppElem, 'label');
        labelElem.text = appId;

        // print xml pretty
        var xmlPretty = pd.xml(etree.write());
        return xmlPretty;
      })

      .then(function(xmlPretty) {
          Q.denodeify(fs.writeFile)(self.manifest_path, xmlPretty);
        });
    }, // addUiAppInManifest

    removeApp: function(appId) {
      var self = this;
      var app = self.getAppSync(appId);

      return Q.fcall(function() {
        if (app === null) {  // equals to ((=== null) or (=== undefined))
          throw new JsnError(appId + ' doesn\'t exist');
        }
      })

      .then(function() {
        return Q.denodeify(fs.readFile)(self.manifest_path);
      })

      .then(function(data) {
        var etree = et.parse(data.toString());
        var root = etree.getroot();
        var uiAppElems = root.findall('./ui-application');
        if (uiAppElems) {
          var len = uiAppElems.length;
          for (var i = 0; i < len; i++) {
            var uiApp = uiAppElems[i];
            if (uiApp.get('appid') == appId) {
              root.remove(uiApp);
              var xmlPretty = pd.xml(etree.write());
              return xmlPretty;
            }
          }
        }
        throw new JsnError('Can\'t get valid ui-application element' +
                           'while parsing mafniest file');
      })

      .then(function(xmlPretty) {
          Q.denodeify(fs.writeFile)(self.manifest_path, xmlPretty);
        })

      .then(function() {
        var len = self.apps.length;
        for (var i = 0; i < len; i++) {
          var app = self.apps[i];
          if (app.app_id == appId) {
            self.apps.splice(i, 1);
            break;
          }
        }
        self.has_app = (self.apps.length > 0) ? true : false;
      });
    }, // removeApp

    // it is not async, so adds 'sync' to the its name
    getAppSync: function(appId) {
      if (!this.has_app)
        return null;
      var len = this.apps.length;
      for (var i = 0; i < len; i++) {
        var app = this.apps[i];
        if (app.app_id == appId)
          return app;
      }
      return null;
    } // getAppSync
  };

  /**
    * This Parser module is a class. Parser contains actions such as parsing
    * manifest file, and adding/removing 'ui-application' element.
    * Parser does 'async' by 'Promises' with 'q'.
    * (Reference to 'cli.js')
    */
  module.exports = Parser;
}());