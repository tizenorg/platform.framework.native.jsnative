'use strict'

const fs = require('fs');
const path = require('path');
const et = require('elementtree');
const pd = require('pretty-data').pd;
const Q = require('q');
const format = require('string-template');

const JsnError = require('./jsn_error');

const MANIFEST_FILE = 'tizen-manifest.xml';

class Parser {
  // this constructor doesn't use any Promises
  constructor(execPath) {
    this.exec_path = execPath;
    this.manifest_path = '';
    this.has_package = false;
    this.package = {};
    this.has_app = false;
    this.apps = [];

    // parsed_ expresses done to parse
    this.parsed = false;

    // ready_ expresses ready for parsing
    this.ready = (() => {
      const maybeManifestPath = path.join(this.exec_path,
                                          MANIFEST_FILE);
      const existManifest = (path => {
          try {
            return (fs.statSync(path));
          } catch(err) {
            return false;
          }
      })(maybeManifestPath);
      if (existManifest) {
        this.manifest_path = maybeManifestPath;
        return true;
      } else {
        return false;
      }
    })();
  }

  set(key, val) {
    this[key] = val;
  }

  get(key) {
    return this[key];
  }

  /**
    * parses manifest file and its contents are parsed to Parser's
    * members. this method returns a promise.
    */
  parse() {
    if (this.ready === false) {
      return Q.fcall(() => {
        throw new JsnError('Parser is not ready. ' +
                           'Checks whether the manifest file exists');
      });
    }

    return Q.denodeify(fs.readFile)(this.manifest_path)
    .then(data => {
      const etree = et.parse(data.toString());

      // parse package
      const manifestElem = etree.getroot();
      if (manifestElem) {
        const pack = {
          pkg_id: manifestElem.get('package'),
          pkg_version: manifestElem.get('version'),
          api_version: manifestElem.get('api-version')
        };
        this.package = pack;
        this.has_package = true;
      } else {
        throw new JsnError('Can\'t get manifest element ' +
                           'while parsing manifest file');
      }

      // parse apps
      const uiAppElems = etree.findall('./ui-application');
      if (uiAppElems) {
        const len = uiAppElems.length;
        this.has_app = (len > 0) ? true : false;
        for (let i = 0; i < len; i++) {
          const uiApp = uiAppElems[i];
          const app = {
            app_id: uiApp.get('appid'),
            exec: uiApp.get('exec'),
            type: uiApp.get('type')
          };
          this.apps[i] = app;
        }
      } else {
        throw new JsnError('Can\'t get any ui app elements ' +
                           'while parsing manifest file');
      }
      this.parsed = true;
    })

    .then(() => console.log('Parsing is successful'));
  } // parse

  addUiAppInManifest(appId) {
    return Q.denodeify(fs.readFile)(this.manifest_path)
    .then(data => {
      const etree = et.parse(data.toString());
      const subElement = et.SubElement;
      let root = etree.getroot();
      let uiAppElem = subElement(root, 'ui-application');
      uiAppElem.set('appid', appId);
      uiAppElem.set('exec', this.package.pkg_id + '.' + appId);
      uiAppElem.set('type', 'jsapp');
      uiAppElem.set('multiple', 'false');
      uiAppElem.set('taskmanage', 'true');
      uiAppElem.set('nodisplay', 'false');

      let iconElem = subElement(uiAppElem, 'icon');
      iconElem.text = 'icon.png';
      let labelElem = subElement(uiAppElem, 'label');
      labelElem.text = appId;

      // print xml pretty
      const xmlPretty = pd.xml(etree.write());
      return xmlPretty;
    })

    .then(xmlPretty =>
        Q.denodeify(fs.writeFile)(this.manifest_path, xmlPretty));
  } // addUiAppInManifest

  removeApp(appId) {
    const app = this.getAppSync(appId);

    return Q.fcall(() => {
      if (app == null) {  // equals to ((=== null) or (=== undefined))
        throw new JsnError(appId + ' doesn\'t exist');
      }
    })

    .then(() => Q.denodeify(fs.readFile)(this.manifest_path))

    .then(data => {
      const etree = et.parse(data.toString());
      let root = etree.getroot();
      const uiAppElems = root.findall('./ui-application');
      if (uiAppElems) {
        const len = uiAppElems.length;
        for (let i = 0; i < len; i++) {
          const uiApp = uiAppElems[i];
          if (uiApp.get('appid') == appId) {
            root.remove(uiApp);
            const xmlPretty = pd.xml(etree.write());
            return xmlPretty;
          }
        }
      }
      throw new JsnError('Can\'t get valid ui-application element' +
                         'while parsing mafniest file');
    })

    .then(xmlPretty =>
        Q.denodeify(fs.writeFile)(this.manifest_path, xmlPretty))

    .then(() => {
      const len = this.apps.length;
      for (let i = 0; i < len; i++) {
        const app = this.apps[i];
        if (app.app_id == appId) {
          this.apps.splice(i, 1);
          break;
        }
      }
      this.has_app = (this.apps.length > 0) ? true : false;
    });
  } // removeApp

  // it is not async, so adds 'sync' to the its name
  getAppSync(appId) {
    if (!this.has_app)
      return null;
    const len = this.apps.length;
    for (let i = 0; i < len; i++) {
      const app = this.apps[i];
      if (app.app_id == appId)
        return app;
    }
    return null;
  } // getAppSync
} // Parser

/**
  * This Parser module is a class. Parser contains actions such as parsing
  * manifest file, and adding/removing 'ui-application' element.
  * Parser does 'async' by 'Promises' with 'q'.
  * (Reference to 'cli.js')
  */
module.exports = Parser;
