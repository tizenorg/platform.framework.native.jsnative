/*
 * Copyright (c) 2016 Samsung Electronics Co., Ltd All Rights Reserved
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

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
    //console.log("### "+e.message);
    return {};
  }
}

function native_async_call(method, parameter, cb) {
  //console.log("### "+method+" / ### " + parameter);
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  var asyncid = async_message_id++;
  args['asyncid'] = 'asyncid_' + asyncid;
  async_map.set(args['asyncid'], cb);
  extension.postMessage(JSON.stringify(args));
}

function registerEventHandler(app) {
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

var EE = require('events');

/**
 * Creates a package manager handle.
 * @class PackageManager
 * @extends Node.EventEmitter
 * @constructor
 * @privilege http://tizen.org/privilege/packagemanager.info
 */
class PackageManager extends EE {
  constructor() {
    console.log("@@@ PackageManager constructor()");
    super();
    registerEventHandler(this);
  }

  /** ???
   * Sets the event status of the package when the package is installed, uninstalled or updated. You can combine multiple status using OR operation which you want to listen.
   * @attribute eventStatus
   * @value 'all' All status
   * @value 'install' Install package status
   * @value 'uninstall' Uninstall package status
   * @value 'upgrade' Upgrade package status
   * @value 'move' Move package status
   * @value 'clear-data' Clear data status
   * @value 'install-progress' Install progress status
   * @value 'get-size' Get size status
   **/

  /**
   * Retrieves all package information of installed packages.
   * @method getPackagesInfo
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Promise|PackageManager.PackageInfo[]}
   * @throws
   * * TypeError
   * * NotFoundError
   * * NotPermittedError
   **/
  getPackagesInfo() {
    console.log("@@@ getPackagesInfo()");
    return new Promise(function(resolve, reject) {
      native_async_call('getPackagesInfo', undefined, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
          return;
        }
        var packages = result['data'].map(functon(id) {
          return new PackageInfo();
        });
        resolve(packages);
      });
    });
  }

  /**
   * Gets the package ID for the given app ID.
   * @method getPackageIdByAppId
   * @param {String} appId The ID of the application
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {String}
   * @throws
   * * TypeError
   * * QuotaExceededError
   * * NotPermittedError
   **/
  getPackageIdByAppId(appId) {
    console.log("@@@ getPackageIdByAppId()");
    var args = {'appId': appId};
    return native_sync_call('getPackageIdByAppId', args)['data'];
  }

  /**
   * Gets the package information for the given package.
   * @method getPackageInfo
   * @param {String} packageId The ID of the package
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {PackageManager.PackageInfo} The package information for the given package ID
   * @throws
   * * TypeError
   * * QuotaExceededError
   * * NotPermittedError
   * * NotFoundError
   **/
  getPackageInfo(packageId) {
    console.log("@@@ getPackageInfo()");
    var args = {'packageId': packageId};
    return native_sync_call('getPackageInfo', args)['data'];
  }

  /**
   * Compares whether two package certifications are matched.
   * @method comparePackageCertInfo
   * @param {String} lhsPackageId The first package ID to compare
   * @param {String} rhsPackageId The second package ID to compare
   * @return {String}
   * @value compare-match' Matching certification
   * @value compare-mismatch' Mismatching certification
   * @value lhs-no-cert' First package has no certification
   * @value compare-rhs-no-cert' Second package has no certification
   * @value compare-both-no-cert' Both have no certification
   * @throws
   * * TypeError
   * * NotReadableError
   **/
  comparePackageCertInfo(lhsPackageId, rhsPackageId) {
    console.log("@@@ comparePackageCertInfo()");
    var args = {'lhsPackageId': lhsPackageId, 'rhsPackageId': rhsPackageId};
    return native_sync_call('comparePackageCertInfo', args)['data'];
  }

  /**
   * Compares whether two app certifications are matched.
   * @method compareAppCertInfo
   * @param {String} lhsAppId The first app ID to compare
   * @param {String} rhsAppId The second app ID to compare
   * @return {String}
   * @value compare-match' Matching certification
   * @value compare-mismatch' Mismatching certification
   * @value lhs-no-cert' First package has no certification
   * @value compare-rhs-no-cert' Second package has no certification
   * @value compare-both-no-cert' Both have no certification
   * @throws
   * * TypeError
   * * NotReadableError
   **/
  compareAppCertInfo(lhsAppId, rhsAppId) {
    console.log("@@@ compareAppCertInfo()");
    var args = {'lhsAppId': lhsAppId, 'rhsAppId': rhsAppId};
    return native_sync_call('compareAppCertInfo', args)['data'];
  }

  /**
   * Checks whether the package is preloaded by appId.
   * @method isPreloadPackageByAppId
   * @param {String} appId The ID of the application
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Boolean} The preload info of the package
   * @throws
   * * NotFoundError
   * * NotPermittedError
   **/
  isPreloadPackageByAppId(appId) {
    console.log("@@@ isPreloadPackageByAppId()");
    var args = {'appId': appId};
    return native_sync_call('isPreloadPackageByAppId', args)['data'];
  }

  /**
   * Gets the package permission type by appId.
   * @method getPermissionType
   * @param {String} appId The ID of the application
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {String}
   * @value normal' Normal permission
   * @value signature' Signature permission
   * @value privilege' Privilege permission
   * @throws
   * * NotFoundError
   * * NotPermittedError
   **/
  getPermissionType(appId) {
    console.log("@@@ getPermissionType()");
    var args = {'appId': appId};
    return native_sync_call('getPermissionType', args)['data'];
  }

  /**
   * Clears the application's internal and external cache directory.
   * @method clearCacheDir
   * @param {String} packageId The package ID
   * @privilege http://tizen.org/privilege/packagemanager.clearcache
   **/
  clearCacheDir() {
    console.log("@@@ clearCacheDir()");
    native_sync_call('clearCacheDir');
  }

  /**
   * Clears all applications' internal and external cache directory.
   * @method clearAllCacheDir
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  clearAllCacheDir() {
    console.log("@@@ clearAllCacheDir()");
    native_sync_call('clearAllCacheDir');
  }

  /**
   * Gets the package size information.
   * The package size info is asynchronously obtained by the callback function.
   * @method getPackageSizeInfo
   * @param {String} packageId The package ID
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Promise|PackageManager.PackageSizeInfo}
   * @throws
   * * TypeError
   * * NotFoundError
   * * NotPermittedError
   * * QuotaExceededError
   * * NotReadableError
   **/
  getPackageSizeInfo(packageId) {
    console.log("@@@ getPackageSizeInfo()");
    return new Promise(function(resolve, reject) {
      var args = {'packageId': packageId};
      native_async_call('getPackageSizeInfo', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
          return new PackageSizeInfo();
        } else {
          reject(new Error(result['reason']));
          return;
        }
      });
    });
  }

  /**
   * Gets the total package size information.
   * The total package size info is asynchronously obtained by the callback function.
   * @method getTotalPackageSizeInfo
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Promise|PackageManager.PackageSizeInfo}
   * @throws
   * * TypeError
   * * NotFoundError
   * * NotPermittedError
   * * QuotaExceededError
   * * NotReadableError
   * * SystemError
   **/
  getTotalPackageSizeInfo() {
    console.log("@@@ getTotalPackageSizeInfo()");
    return new Promise(function(resolve, reject) {
      native_async_call('getTotalPackageSizeInfo', undefined, function(result) {
        if (result['result'] == 'OK') {
          resolve();
          return new PackageSizeInfo();
        } else {
          reject(new Error(result['reason']));
          return;
        }
      });
    });
  }

  /**
   * Generates request for getting License.
   * @method requestDrmGenerateLicense
   * @param {String} responseData The response data string of the purchase request
   * @privilege http://tizen.org/privilege/packagemanager.admin
   * @return {Object}
   * * reqData - License request data
   * * licenseUrl - License acquisition url data
   * @throws
   * * TypeError
   * * NotReadableError
   * * NotPermittedError
   **/
  requestDrmGenerateLicense(responseData) {
    console.log("@@@ requestDrmGenerateLicense()");
    var args = {'responseData': responseData};
    return native_sync_call('requestDrmGenerateLicense', args)['data'];
  }

  /**
   * Registers encrypted license.
   * @method registerDrmLicense
   * @param {String} responseData The response data string of the rights request
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  registerDrmLicense(responseData) {
    console.log("@@@ registerDrmLicense()");
    var args = {'responseData': responseData};
    native_sync_call('registerDrmLicense', args);
  }

  /**
   * Decrypts contents which is encrypted.
   * @method decryptDrmPackage
   * @param {String} drmFilePath DRM file path
   * @param {String} decryptedFilePath Decrypted file path
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  decryptDrmPackage(drmFilePath, decryptedFilePath) {
    console.log("@@@ decryptDrmPackage()");
    var args = {'drmFilePath': drmFilePath, 'decryptedFilePath': decryptedFilePath};
    native_sync_call('decryptDrmPackage', args);
  }

  /**
   * Registers a callback function to be invoked when the package is installed, uninstalled or updated.
   * @event change
   * @param {Object} event Called when the package is installed, uninstalled or updated, and the progress of the request to the package manager changes.
   * @param {String} event.type The type of the package to be installed, uninstalled or updated
   * @param {String} event.package The name of the package to be installed, uninstalled or updated
   * @param {String} event.eventType The type of the request to the package manager
   * @value 'install' Install event type
   * @value 'uninstall' Uninstall event type
   * @value 'update' Update event type
   * @param {String} event.eventState The current state of the request to the package manager
   * @value 'started' Started event state
   * @value 'processing' Processing event state
   * @value 'completed' Completed event state
   * @value 'failed' Failed event state
   * @param {short} event.progress The progress for the request that is being processed by the package manager. The range of progress is from 0 to 100.
   * @privilege http://tizen.org/privilege/packagemanager.info
   **/
  __event_handle__(msg) {
    if (msg['event'] == 'change') {
      this.emit(msg['event'], msg['data']);
    } else if (
      [
        'type', 'package', ['install', 'uninstall', 'update'],
        ['started', 'processing', 'completed', 'failed'], 'progress'
      ].indexOf(msg['event']) >= 0) {
      this.emit(msg['event'], msg['data']);
    } else {
      console.log('invalid event was passed');
    }
  }
};


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
    console.log("@@@ getAppIdsFromPackage()");
    return new Promise(function(resolve, reject) {
      var args = {'componentType': componentType};
      native_async_call('getAppIdsFromPackage', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
          return new PackageInfo();
        } else {
          reject(new Error(result['reason']));
          return;
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
    console.log("@@@ getCertInfo()");
    return new Promise(function(resolve, reject) {
      native_async_call('getCertInfo', undefined, function(result) {
        if (result['result'] == 'OK') {
          resolve();
          return new CertInfo();
        } else {
          reject(new Error(result['reason']));
          return;
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
    console.log("@@@ getPrivilegeInfo()");
    return new Promise(function(resolve, reject) {
      native_async_call('getPrivilegeInfo', undefined, function(result) {
        if (result['result'] == 'OK') {
          resolve();
          return new PrivilegeInfo();
        } else {
          reject(new Error(result['reason']));
          return;
        }
      });
    });
  }
};


/**
 * Called when the total package size information is obtained.
 * A instance of PackageSizeInfo is created through the PackageManager.getPackageSizeInfo()
 * @namespace PackageManager
 * @class PackageSizeInfo
 */
class PackageSizeInfo {
  /**
   * Retrieves data size from given handle.
   * @attribute dataSize
   * @readOnly
   **/
  get dataSize() {
    console.log("@@@ get dataSize attribute");
    //return this.dataSize;
  }

  /**
   * Retrieves cache size from given handle.
   * @attribute cacheSize
   * @readOnly
   **/
  get cacheSize() {
    console.log("@@@ get cacheSize attribute");
    //return this.cacheSize;
  }

  /**
   * Retrieves application size from given handle.
   * @attribute appSize
   * @readOnly
   **/
  get appSize() {
    console.log("@@@ get appSize attribute");
    //return this.appSize;
  }

  /**
   * Retrieves external data size from given handle.
   * @attribute externalDataSize
   * @readOnly
   **/
  get externalDataSize() {
    console.log("@@@ get externalDataSize attribute");
    //return this.externalDataSize;
  }

  /**
   * Retrieves external cache size from given handle.
   * @attribute externalCacheSize
   * @readOnly
   **/
  get externalCacheSize() {
    console.log("@@@ get externalCacheSize attribute");
    //return this.externalCacheSize;
  }

  /**
   * Retrieves external application size from given handle.
   * @attribute externalAppSize
   * @readOnly
   **/
  get externalAppSize() {
    console.log("@@@ get externalAppSize attribute");
    //return this.externalAppSize;
  }
};


/**
 * Creates the package information filter handle from db.
 * All filter properties will be ANDed.
 * @namespace PackageManager
 * @class Filter
 * @constructor
 * @privilege http://tizen.org/privilege/packagemanager.info
 */
class Filter {
  constructor() {
    console.log("@@@ Filter constructor()");
  }
  /**
   * This API adds a boolean filter property to the filter handle.
   * @method addBooleanFilter
   * @param {String} property boolean property name.
   * @param {Boolean} value value corresponding to the property.
   **/
  addBooleanFilter(property, value) {
    console.log("@@@ addBooleanFilter()");
    var args = {'property': property, 'value': value};
    native_sync_call('addBooleanFilter', args);
  }

  /**
   * This API counts the package that satisfy the filter conditions.
   * @attribute countPackageFilter
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @readOnly
   **/
  get countPackageFilter() {
    console.log("@@@ get countPackageFilter attribute");
    return native_sync_call('countPackageFilter')['data'];
  }

  /**
   * This API executes the user supplied callback function for each package that satisfy the filter conditions.
   * @method getPackageInfoFilter
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Promise|PackageManager.PackageInfo}
   * @throws
   * * TypeError
   * * NotPermittedError
   * * NotReadableError
   **/
  getPackageInfoFilter() {
    console.log("@@@ getPackageInfoFilter()");
    return new Promise(function(resolve, reject) {
      native_async_call('getPackageInfoFilter', undefined, function(result) {
        if (result['result'] == 'OK') {
          resolve();
          return new PackageInfo();
        } else {
          reject(new Error(result['reason']));
          return;
        }
      });
    });
  }
};


/**
 * Creates a request handle to the package manager.
 * @namespace PackageManager
 * @class Request
 * @extends Node.EventEmitter
 * @constructor
 */
class Request extends EE {
  constructor() {
    console.log("@@@ Request constructor()");
    super();

    this.type_ = null;
    this.mode_ = null;
    this.tep_ = null;
  }

  /**
   * Sets the type of the package to install, uninstall or update.
   * @attribute type
   * @type {String}
   **/
  get type() {
    console.log("@@@ get type attribute");
    return this.type_;
  }

  set type(value) {
    this.type_ = value;
    console.log("@@@ set type attribute : " + value);
  }

  /**
   * Sets the mode of the request.
   * @attribute mode
   * @value 'default' This is not for use by third-party applications. Default request mode
   * @value 'quiet' This is not for use by third-party applications. Quiet request mode
   **/
  get mode() {
    console.log("@@@ get mode attribute");
    return this.mode_;
  }

  set mode(value) {
    this.mode_ = value;
    console.log("@@@ set mode attribute : " + value);
  }

  /**
   * Sets the path of TEP file to the request.
   * The TEP file that is set will be installed when the package is installed.
   * @attribute tep
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  get tep() {
    console.log("@@@ get tep attribute");
    return this.tep_;
  }

  set tep(value) {
    this.tep_ = value;
    console.log("@@@ set tep attribute : " + value);
  }

  /**
   * Installs the package located at the given path.
   * @method install
   * @param {String} path The absolute path to the package to be installed
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.admin
   * @return {Promise|short} The ID of the request to the package manager
   * @throws
   * * TypeError
   * * NotPermittedError
   * * NotReadableError
   * * QuotaExceededError
   * * NotFoundError
   **/
  install(path) {
    console.log("@@@ install()");
    return new Promise(function(resolve, reject) {
      var args = {'path': path};
      native_async_call('install', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }

  /**
   * Uninstalls the package with the given name.
   * @method uninstall
   * @param {String} name The name of the package to be uninstalled
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.admin
   * @return {Promise|short} The ID of the request to the package manager
   * @throws
   * * TypeError
   * * NotPermittedError
   * * NotReadableError
   * * QuotaExceededError
   * * NotFoundError
   **/
  uninstall(name) {
    console.log("@@@ uninstall()");
    return new Promise(function(resolve, reject) {
      var args = {'name': name};
      native_async_call('uninstall', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }

  /**
   * Moves the package from SD card to the internal memory and vice versa.
   * @method move
   * @param {String} name The name of the package to be moved
   * @param {String} moveType The move type [external to internal/internal to external]
   * @value 'internal' Internal type
   * @value 'external' External type
   * @async
   * @return {Promise}
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  move(name, moveType) {
    console.log("@@@ move()");
    return new Promise(function(resolve, reject) {
      var args = {};
      args['name'] = name;
      args['moveType'] = moveType;
      native_async_call('move', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
  }

  /**
   * Registers a callback function to be invoked when the progress of the request changes.
   * @event requestChange
   * @param {Object} event Called when the progress of the request to the package manager changes.
   * @param {String} event.id The ID of the request to the package manager
   * @param {String} event.type The type of the package to install, uninstall or update
   * @param {String} event.package The name of the package to install, uninstall or update
   * @param {String} event.eventType The type of the request to the package manager
   * @value 'install' Install event type
   * @value 'uninstall' Uninstall event type
   * @value 'update' Update event type
   * @param {String} event.eventState The current state of the request to the package manager
   * @value 'started' Started event state
   * @value 'processing' Processing event state
   * @value 'completed' Completed event state
   * @value 'failed' Failed event state
   * @param {short} event.progress The progress for the request that is being processed by the package manager. The range of progress is from 0 to 100.
   * @privilege http://tizen.org/privilege/packagemanager.info
   **/
  __event_handle__(msg) {
    if (msg['event'] == 'requestChange') {
      this.emit(msg['event'], msg['data']);
    } else if (
      [
        'id', 'type', 'package', ['install', 'uninstall', 'update'],
        ['started', 'processing', 'completed', 'failed'], 'progress'
      ].indexOf(msg['event']) >= 0) {
      this.emit(msg['event'], msg['data']);
    } else {
      console.log('invalid event was passed');
    }
  }
};

exports.PackageManager = PackageManager;
exports.PackageInfo = PackageInfo;
exports.PackageSizeInfo = PackageSizeInfo;
exports.Filter = Filter;
exports.Request = Request;

module.exports = new PackageManager();
