'use strict';

var async_message_id = 0;
var async_map = new Map();

function native_sync_call(method, parameter) {
  console.log("### "+method+" / ### " + parameter);
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log("### "+e.message);
    return {};
  }
}

function native_async_call(method, parameter, cb) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  var asyncid = async_message_id++;
  args['asyncid'] = 'asyncid_' + asyncid;
  async_map.set(args['asyncid'], cb);
  extension.postMessage(JSON.stringify(args));
}

function registEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
        var cb = async_map.get(msg['asyncid']);
        async_map.delete(msg['asyncid']);
        if (cb instanceof Function) {
          cb(msg);
        } else {
          console.log('cb is not function');
        }
      } else {
        self.__event_handle__(msg);
      }
    };
  })(app);
  extension.setMessageListener(handler);
}


var enumType = require('./tizen-package-manager_enumerations.js');


/**
 * Called to get the certification information.
 * @namespace PackageManager
 * @class CertInfo
 */
class CertInfo {
  /**
   * The certificate type
   * @attribute type
   * @value 'author-root' Author Root Certificate
   * @value 'author-intermediate' Author Intermediate Certificate
   * @value 'author-signer' Author Signer Certificate
   * @value 'distributor-root' Distributor Root Certificate
   * @value 'distributor-intermediate' Distributor Intermediate Certificate
   * @value 'distributor-signer' Distributor Signer Certificate
   * @value 'distributor2-root' Distributor2 Root Certificate
   * @value 'distributor2-intermediate' Distributor2 Intermediate Certificate
   * @value 'distributor2-signer' Distributor2 Signer Certificate
   * @readOnly
   **/
  get type() {
    console.log("@@@ get type attribute");
    return this.type;
  }

  /**
   * The certificate value of corresponding certificate key.
   * This value is base64 encoded data.
   * @attribute value
   * @readOnly
   **/
  get value() {
    console.log("@@@ get value attribute");
    return this.value;
  }
};


/**
 * Called to get the privilege information.
 * @namespace PackageManager
 * @class PrivilegeInfo
 */
class PrivilegeInfo {
  /**
   * The name of the privilege
   * @attribute name
   * @readOnly
   **/
  get name() {
    console.log("@@@ get name attribute");
    return this.name;
  }
};


/**
 * Gets the package information for the given package.
 * A instance of PackageInfo is created through the PackageManager.getPackageInfo()
 * and PackageManager.getPackagesInfo() method.
 * @namespace PackageManager
 * @class PackageInfo
 */
class PackageInfo {
  /**
   * Retrieves all application IDs of each package.
   * @method getAppIdsFromPackage
   * @param {String} componentType The application component type
   * @value 'all-app' All application
   * @value 'ui-app' UI application
   * @value 'service-app' Service application
   * @async
   * @return {Promise|PackageManager.PackageInfo[]}
   * @throws
   * * TypeError
   * * NotFoundError
   **/
  getAppIdsFromPackage(componentType) {
    return new Promise(function(resolve, reject) {
      var args = {'componentType': componentType};
      native_async_call('getAppIdsFromPackage', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }

  /**
   * Gets the package name.
   * @attribute package
   * @readOnly
   **/
  get package() {
    console.log("@@@ get package attribute");
    //return this.package;
  }

  /**
   * Gets the label of the package.
   * @attribute label
   * @readOnly
   **/
  get label() {
    console.log("@@@ get label attribute");
    //return this.label;
  }

  /**
   * Gets the absolute path to the icon image.
   * @attribute icon
   * @readOnly
   **/
  get icon() {
    console.log("@@@ get icon attribute");
    //return this.icon;
  }

  /**
   * Gets the version of the package.
   * @attribute version
   * @readOnly
   **/
  get version() {
    console.log("@@@ get version attribute");
    //return this.version;
  }

  /**
   * Gets the type of the package.
   * @attribute type
   * @readOnly
   **/
  get type() {
    console.log("@@@ get type attribute");
    //return this.type;
  }

  /**
   * Gets the name of the TEP(Tizen Expansion Package).
   * @attribute tepName
   * @privilege http://tizen.org/privilege/packagemanager.admin
   * @readOnly
   **/
  get tepName() {
    console.log("@@@ get tepName attribute");
    //return this.tepName;
  }

  /**
   * Checks whether the package is system package.
   * @attribute isSystemPackage
   * @readOnly
   **/
  get isSystemPackage() {
    console.log("@@@ get isSystemPackage attribute");
    //return this.isSystemPackage;
  }

  /**
   * Gets the installed storage for the given package.
   * @attribute installedStorage
   * @value 'internal-storage' Internal storage
   * @value 'external-storage' External storage
   * @readOnly
   **/
  get installedStorage() {
    console.log("@@@ get installedStorage attribute");
    //return this.installedStorage;
  }

  /**
   * Gets the root path of the package.
   * @attribute rootPath
   * @readOnly
   **/
  get rootPath() {
    console.log("@@@ get rootPath attribute");
    //return this.rootPath;
  }

  /**
   * Checks whether the package is removable.
   * @attribute isRemovablePackage
   * @readOnly
   **/
  get isRemovablePackage() {
    console.log("@@@ get isRemovablePackage attribute");
    //return this.isRemovablePackage;
  }

  /**
   * Checks whether the package is preloaded.
   * @attribute isPreloadPackage
   * @readOnly
   **/
  get isPreloadPackage() {
    console.log("@@@ get isPreloadPackage attribute");
    //return this.isPreloadPackage;
  }

  /**
   * Checks whether the package info is accessible for the given package.
   * @attribute isAccessible
   * @readOnly
   **/
  get isAccessible() {
    console.log("@@@ get isAccessible attribute");
    //return this.isAccessible;
  }

  /**
   * Retrieves certification information of the package.
   * @method getCertInfo
   * @async
   * @return {Promise|PackageManager.CertInfo}
   * @throws
   * * TypeError
   * * NotReadableError
   **/
  getCertInfo() {
    return new Promise(function(resolve, reject) {
      var args = {};
      args['argv'] = process.argv.slice(1);
      native_async_call('getCertInfo', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }

  /**
   * Retrieves privilege information of the package.
   * @method getPrivilegeInfo
   * @async
   * @return {Promise|PackageManager.PrivilegeInfo}
   * @throws
   * * TypeError
   **/
  getPrivilegeInfo() {
    return new Promise(function(resolve, reject) {
      var args = {};
      args['argv'] = process.argv.slice(1);
      native_async_call('getPrivilegeInfo', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }
};


exports.PackageInfo = PackageInfo;
//exports.PackageInfo = new PackageInfo();