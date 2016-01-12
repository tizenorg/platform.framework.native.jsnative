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
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  var resultString = extension.internal.sendSyncMessage(JSON.stringify(args));
  console.log("************************ \n"+resultString);
  var result = JSON.parse(resultString);
  try {
    return result;
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

var EventEmitter = require('events');


/**
 * Creates a package manager handle.
 * @class PackageManager
 * @extends Node.EventEmitter
 * @constructor
 * @privilege http://tizen.org/privilege/packagemanager.info
 */
class PackageManager extends EventEmitter {
  constructor() {
    console.log("@@@ PackageManager constructor()");
    super();
    registerEventHandler(this);

    this.packagInfo_ = new PackageInfo();
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
          console.log("$$$ Error");
          return;
        }
        var packageinfoArray = result['packageinfoArray'].map(function() {
          console.log("$$$ Success");
          return new PackageInfo();
        });
        resolve(packages);
      });
    });
  }

  /** OK
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
    var result = native_sync_call('getPackageInfo', args);
    if (result['result'] == 'OK') {
      console.log("$$$ Success");
      var packageinfo = result['packageinfo'];
      for (let info in packageinfo) {
        if (info == 'id') {this.packagInfo_.id_ = packageinfo[info];}
		if (info == 'name') {this.packagInfo_.name_ = packageinfo[info];}
		if (info == 'iconPath') {this.packagInfo_.iconPath_ = packageinfo[info];}
		if (info == 'version') {this.packagInfo_.version_ = packageinfo[info];}
		if (info == 'type') {this.packagInfo_.type_ = packageinfo[info];}
		//if (info == 'tepName') {this.packagInfo_.tepName_ = packageinfo[info];}
		if (info == 'installedStorage') {this.packagInfo_.installedStorage_ = packageinfo[info];}
		if (info == 'rootPath') {this.packagInfo_.rootPath_ = packageinfo[info];}
		if (info == 'isSystemPackage') {this.packagInfo_.isSystemPackage_ = packageinfo[info];}
		if (info == 'isRemovablePackage') {this.packagInfo_.isRemovablePackage_ = packageinfo[info];}
		if (info == 'isPreloadPackage') {this.packagInfo_.isPreloadPackage_ = packageinfo[info];}
		if (info == 'isAccessible') {this.packagInfo_.isAccessible_ = packageinfo[info];}
      }
      return packageinfo;
    } else {
      console.log("$$$ Error");
      return undefined;
    }
  }

  /** OK
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
    var result = native_sync_call('getPackageIdByAppId', args);
    if (result['result'] == 'OK') {
      console.log("$$$ Success");
      return result["packageId"];
    } else {
      console.log("$$$ Error");
      return undefined;
    }
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
	var result = native_sync_call('comparePackageCertInfo', args);
    return;
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
    var result = native_sync_call('compareAppCertInfo', args);
	return;
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
    var result = native_sync_call('isPreloadPackageByAppId', args);
	return;
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
    var result = native_sync_call('getPermissionType', args);
	return;
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
 * Gets the package information for the given package.
 * A instance of PackageInfo is created through the PackageManager.getPackageInfo()
 * and PackageManager.getPackagesInfo() method.
 * @class PackageInfo
 */
class PackageInfo {
  constructor() {
    this.id_ = null;
    this.name_ = null;
    this.iconPath_ = null;
    this.version_ = null;
    this.type_ = null;
    this.installedStorage_ = null;
    this.rootPath_ = null;
    this.isSystemPackage_ = false;
    this.isRemovablePackage_ = false;
    this.isPreloadPackage_ = false;
    this.isAccessible_ = false;
  }
  /** OK
   * Gets the package name.
   * @attribute id
   * @readOnly
   **/
  get id() {
    console.log("@@@ get id attribute");
    return this.id_;
  }

  /** OK
   * Gets the label of the package.
   * @attribute name
   * @readOnly
   **/
  get name() {
    console.log("@@@ get name attribute");
    return this.name_;
  }

  /** OK
   * Gets the absolute path to the icon image.
   * @attribute iconPath
   * @readOnly
   **/
  get iconPath() {
    console.log("@@@ get iconPath attribute");
    return this.iconPath_;
  }

  /** OK
   * Gets the version of the package.
   * @attribute version
   * @readOnly
   **/
  get version() {
    console.log("@@@ get version attribute");
    return this.version_;
  }

  /** OK
   * Gets the type of the package.
   * @attribute type
   * @readOnly
   **/
  get type() {
    console.log("@@@ get type attribute");
    return this.type_;
  }

  /** OK
   * Gets the installed storage for the given package.
   * @attribute installedStorage
   * @value 'internal-storage' Internal storage
   * @value 'external-storage' External storage
   * @readOnly
   **/
  get installedStorage() {
    console.log("@@@ get installedStorage attribute");
    return this.installedStorage_;
  }

  /** OK
   * Gets the root path of the package.
   * @attribute rootPath
   * @readOnly
   **/
  get rootPath() {
    console.log("@@@ get rootPath attribute");
    return this.rootPath_;
  }

  /** OK
   * Checks whether the package is system package.
   * @attribute isSystemPackage
   * @readOnly
   **/
  get isSystemPackage() {
    console.log("@@@ get isSystemPackage attribute");
    return this.isSystemPackage_;
  }

  /** OK
   * Checks whether the package is removable.
   * @attribute isRemovablePackage
   * @readOnly
   **/
  get isRemovablePackage() {
    console.log("@@@ get isRemovablePackage attribute");
    return this.isRemovablePackage_;
  }

  /** OK
   * Checks whether the package is preloaded.
   * @attribute isPreloadPackage
   * @readOnly
   **/
  get isPreloadPackage() {
    console.log("@@@ get isPreloadPackage attribute");
    return this.isPreloadPackage_;
  }

  /** OK
   * Checks whether the package info is accessible for the given package.
   * @attribute isAccessible
   * @readOnly
   **/
  get isAccessible() {
    console.log("@@@ get isAccessible attribute");
    return this.isAccessible_;
  }

  /** NO
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

  /** NO
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
          return ;
        } else {
          reject(new Error(result['reason']));
          return;
        }
      });
    });
  }

  /** NO
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
          return ;
        } else {
          reject(new Error(result['reason']));
          return;
        }
      });
    });
  }
};


/**
 * Called to get the certification information.
 * @class CertInfo
 */
class CertInfo {
  constructor() {
    this.type_ = null;
	this.value_ = null;
  }
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
    return this.type_;
  }

  /**
   * The certificate value of corresponding certificate key.
   * This value is base64 encoded data.
   * @attribute value
   * @readOnly
   **/
  get value() {
    console.log("@@@ get value attribute");
    return this.value_;
  }
};


/**
 * Called to get the privilege information.
 * @class PrivilegeInfo
 */
class PrivilegeInfo {
  constructor() {
    this.name_ = null;
  }
  /**
   * The name of the privilege
   * @attribute name
   * @readOnly
   **/
  get name() {
    console.log("@@@ get name attribute");
    return this.name_;
  }
};


/**
 * Called when the total package size information is obtained.
 * A instance of PackageSizeInfo is created through the PackageManager.getPackageSizeInfo()
 * @class PackageSizeInfo
 */
class PackageSizeInfo {
  constructor() {

    this.dataSize_ = 0;
    this.cacheSize_ = 0;
    this.appSize_ - 0;
    this.externalDataSize_ = 0;
    this.externalCacheSize_ = 0;
    this.externalAppSize_ = 0;
  }
  /**
   * Retrieves data size from given handle.
   * @attribute dataSize
   * @readOnly
   **/
  get dataSize() {
    console.log("@@@ get dataSize attribute");
    return this.dataSize_;
  }

  /**
   * Retrieves cache size from given handle.
   * @attribute cacheSize
   * @readOnly
   **/
  get cacheSize() {
    console.log("@@@ get cacheSize attribute");
    return this.cacheSize_;
  }

  /**
   * Retrieves application size from given handle.
   * @attribute appSize
   * @readOnly
   **/
  get appSize() {
    console.log("@@@ get appSize attribute");
    return this.appSize_;
  }

  /**
   * Retrieves external data size from given handle.
   * @attribute externalDataSize
   * @readOnly
   **/
  get externalDataSize() {
    console.log("@@@ get externalDataSize attribute");
    return this.externalDataSize_;
  }

  /**
   * Retrieves external cache size from given handle.
   * @attribute externalCacheSize
   * @readOnly
   **/
  get externalCacheSize() {
    console.log("@@@ get externalCacheSize attribute");
    return this.externalCacheSize_;
  }

  /**
   * Retrieves external application size from given handle.
   * @attribute externalAppSize
   * @readOnly
   **/
  get externalAppSize() {
    console.log("@@@ get externalAppSize attribute");
    return this.externalAppSize_;
  }
};


exports = new PackageManager();
//exports.PackageInfo = PackageInfo;
//exports.PackageSizeInfo = PackageSizeInfo;
//exports.Filter = Filter;

//module.exports = new PackageManager();
