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
  var asyncId = async_message_id++;
  args['asyncId'] = 'asyncId_' + asyncId;
  async_map.set(args['asyncId'], cb);
  console.log("************************ \n"+JSON.stringify(args));
  extension.postMessage(JSON.stringify(args));
}

function registerEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      if (msg['asyncId'] && async_map.has(msg['asyncId'])) {
        var cb = async_map.get(msg['asyncId']);
        async_map.delete(msg['asyncId']);
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

    //this.packagSizeInfo_ = new PackageSizeInfo();
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
      //var packageInfo_ = new PackageInfo(packageId);
      var packageInfo_ = new PackageInfo();
      var packageinfo = result['packageinfo'];
      for (let info in packageinfo) {
        if (info == 'id') {packageInfo_.id_ = packageinfo[info];}
        if (info == 'name') {packageInfo_.name_ = packageinfo[info];}
        if (info == 'iconPath') {packageInfo_.iconPath_ = packageinfo[info];}
        if (info == 'version') {packageInfo_.version_ = packageinfo[info];}
        if (info == 'type') {packageInfo_.type_ = packageinfo[info];}
        if (info == 'installedStorage') {packageInfo_.installedStorage_ = packageinfo[info];}
        if (info == 'rootPath') {packageInfo_.rootPath_ = packageinfo[info];}
        if (info == 'isSystemPackage') {packageInfo_.isSystemPackage_ = packageinfo[info];}
        if (info == 'isRemovablePackage') {packageInfo_.isRemovablePackage_ = packageinfo[info];}
        if (info == 'isPreloadPackage') {packageInfo_.isPreloadPackage_ = packageinfo[info];}
        if (info == 'isAccessible') {packageInfo_.isAccessible_ = packageinfo[info];}

        //if (info == 'appIds') {packageInfo_.appIds() = packageinfo[info];}
        //if (info == 'certInfo') {packageInfo_.certInfo() = packageinfo[info];}
        //if (info == 'privilegeInfo') {packageInfo_.privilegeInfo() = packageinfo[info];}
      }
      return packageInfo_;
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

  /** OK
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
    if (result['result'] == 'OK') {
      console.log("$$$ Success");
      return result["compareResult"];
    } else {
      console.log("$$$ Error");
      return undefined;
    }
  }

  /** OK
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
    if (result['result'] == 'OK') {
      console.log("$$$ Success");
      return result["compareResult"];
    } else {
      console.log("$$$ Error");
      return undefined;
    }
  }

  /** OK
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
    if (result['result'] == 'OK') {
      console.log("$$$ Success");
      return result["isPreload"];
    } else {
      console.log("$$$ Error");
      return undefined;
    }
  }

  /** OK
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
    if (result['result'] == 'OK') {
      console.log("$$$ Success");
      return result["permissionType"];
    } else {
      console.log("$$$ Error");
      return undefined;
    }
  }

  /** OK
   * Clears the application's internal and external cache directory.
   * @method clearCacheDir
   * @param {String} packageId The package ID
   * @privilege http://tizen.org/privilege/packagemanager.clearcache
   **/
  clearCacheDir(packageId) {
    console.log("@@@ clearCacheDir()");
    var args = {'packageId': packageId};
    native_sync_call('clearCacheDir', args);
  }

  /** NO
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
        var packagesInfo = result['packagesInfo'].map(function() {
          console.log("$$$ Success");
          return new PackageInfo();
        });
		resolve(packagesInfo);
      });
    });
  }

  /** NO
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
        if (result['reason']) {
          reject(new Error(result['reason']));
          console.log("$$$ Error");
        }
        var packageSizeInfo_ = new PackageSizeInfo();
        var packageSizeInfo = result['packageSizeInfo'];
        for (let sizeInfo in packageSizeInfo) {
          if (sizeInfo == 'dataSize') {packageSizeInfo_.dataSize_ = packagesizeinfo[sizeInfo];console.log("^^^"+packagesizeinfo[sizeInfo]);}
          if (sizeInfo == 'cacheSize') {packageSizeInfo_.cacheSize_ = packagesizeinfo[sizeInfo];console.log("^^^"+packagesizeinfo[sizeInfo]);}
          if (sizeInfo == 'appSize') {packageSizeInfo_.appSize_ = packagesizeinfo[sizeInfo];console.log("^^^"+packagesizeinfo[sizeInfo]);}
          if (sizeInfo == 'externalDataSize') {packageSizeInfo_.externalDataSize_ = packagesizeinfo[sizeInfo];console.log("^^^"+packagesizeinfo[sizeInfo]);}
          if (sizeInfo == 'externalCacheSize') {packageSizeInfo_.externalCacheSize_ = packagesizeinfo[sizeInfo];console.log("^^^"+packagesizeinfo[sizeInfo]);}
          if (sizeInfo == 'externalAppSize') {packageSizeInfo_.externalAppSize_ = packagesizeinfo[sizeInfo];console.log("^^^"+packagesizeinfo[sizeInfo]);}
        }
        resolve(packageSizeInfo_);
      });
    });
  }

  /** NO??
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
      var data = JSON.parse(msg['data']);
      var msg = null;
      this.emit('change', msg);
    } else {
      console.log('invalid event was passed');
    }
  }
};


/**
 * Called to get the certification information.
 * @class CertInfo
 */
class CertInfo {
  constructor() {
      console.log("@@@ CertInfo constructor()");
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
      console.log("@@@ PrivilegeInfo constructor()");
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
 * Gets the package information for the given package.
 * A instance of PackageInfo is created through the PackageManager.getPackageInfo()
 * and PackageManager.getPackagesInfo() method.
 * @class PackageInfo
 * @constructor
// * @param {String} packageId The ID of the package 
 */
class PackageInfo {
  //constructor(packageId) {
  constructor() {
      console.log("@@@ PackageInfo constructor()");
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

    //this.privilegeInfo_ = new PrivilegeInfo();
    //this.certInfo_ = new CertInfo();
  }
  /** OK
   * Gets the package name.
   * @attribute package
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

  /** NO??
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
      var args = {'componentType': componentType, 'packageId': this.id_};
      native_async_call('getAppIdsFromPackage', args, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
          console.log("$$$ Error");
        }
		var appIds = result['appIds'];
        resolve();
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
      var args = {'packageId': this.id_};
      native_async_call('getCertInfo', args, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
          console.log("$$$ Error");
        }
        var certInfo_ = new CertInfo();
        var certInfo = result['certInfo'];
        for (let info in certInfo) {
          if (info == 'type') {certInfo_.type_ = certInfo[info];}
          if (info == 'value') {certInfo_.value_ = certInfo[info];}
        }
        resolve(certInfo_);
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
      var args = {'packageId': this.id_};
      native_async_call('getPrivilegeInfo', args, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
          console.log("$$$ Error");
        }
        var privilegeInfo_ = new PrivilegeInfo();
        var privilegeInfo = result['privilegeInfo'];
        for (let info in privilegeInfo) {
          if (info == 'name') {privilegeInfo_.name_ = privilegeInfo[info];}
        }
        resolve(privilegeInfo_);
      });
    });
  }
};


/**
 * Called when the total package size information is obtained.
 * A instance of PackageSizeInfo is created through the PackageManager.getPackageSizeInfo()
 * @class PackageSizeInfo
 */
class PackageSizeInfo {
  constructor() {
    console.log("@@@ PackageSizeInfo constructor()");
    this.dataSize_ = 0;
    this.cacheSize_ = 0;
    this.appSize_ = 0;
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


/*
var PackageManager = require('tizen-package-manager');
console.log("0. tizen-package-manager "+PackageManager);

var getPackageInfo = PackageManager.getPackageInfo('pkgname');
console.log("1. getPackageInfo() "+getPackageInfo);
console.log("1-1. id : "+getPackageInfo.id);
console.log("1-2. name : "+getPackageInfo.name);
console.log("1-3. iconPath : "+getPackageInfo.iconPath);
console.log("1-4. version : "+getPackageInfo.version);
console.log("1-5. type : "+getPackageInfo.type);
console.log("1-6. isSystemPackage : "+getPackageInfo.isSystemPackage);
console.log("1-7. installedStorage : "+getPackageInfo.installedStorage);
console.log("1-8. rootPath : "+getPackageInfo.rootPath);
console.log("1-9. isRemovablePackage : "+getPackageInfo.isRemovablePackage);
console.log("1-10. isPreloadPackage : "+getPackageInfo.isPreloadPackage);
console.log("1-11. isAccessible : "+getPackageInfo.isAccessible);

var getPackageIdByAppId = PackageManager.getPackageIdByAppId('appname01');
console.log("2. getPackageIdByAppId() "+getPackageIdByAppId);

var comparePackageCertInfo = PackageManager.comparePackageCertInfo('pkgname', 'pkgname');
console.log("3. comparePackageCertInfo() "+comparePackageCertInfo);

var compareAppCertInfo = PackageManager.compareAppCertInfo('appname01', 'appname01');
console.log("4. compareAppCertInfo() "+compareAppCertInfo);

var isPreloadPackageByAppId = PackageManager.isPreloadPackageByAppId('appname01');
console.log("5. isPreloadPackageByAppId() "+isPreloadPackageByAppId);

var getPermissionType = PackageManager.getPermissionType('appname01');
console.log("6. getPermissionType() "+getPermissionType);

var clearCacheDir = PackageManager.clearCacheDir('pkgname');
console.log("7. clearCacheDir() "+clearCacheDir);

PackageManager.getPackagesInfo()
.then(function(packagesInfo) {
  console.log("8. getPackagesInfo() "+packagesInfo);
  for (var cnt in packagesInfo) {
    console.log("8-1. id : "+packagesInfo[cnt].id);
    console.log("8-2. name : "+packagesInfo[cnt].name);
    console.log("8-3. iconPath : "+packagesInfo[cnt].iconPath);
    console.log("8-4. version : "+packagesInfo[cnt].version);
    console.log("8-5. type : "+packagesInfo[cnt].type);
    console.log("8-6. isSystemPackage : "+packagesInfo[cnt].isSystemPackage);
    console.log("8-7. installedStorage : "+packagesInfo[cnt].installedStorage);
    console.log("8-8. rootPath : "+packagesInfo[cnt].rootPath);
    console.log("8-9. isRemovablePackage : "+packagesInfo[cnt].isRemovablePackage);
    console.log("8-10. isPreloadPackage : "+packagesInfo[cnt].isPreloadPackage);
    console.log("8-11. isAccessible : "+packagesInfo[cnt].isAccessible);
  }
}).catch(function(e){
  console.log(e.message);
});

var getPackageSizeInfo = PackageManager.getPackageSizeInfo('pkgname');
console.log("9. getPackageSizeInfo() "+getPackageSizeInfo);
console.log("9-1. dataSize : "+getPackageSizeInfo.dataSize);
console.log("9-2. cacheSize : "+getPackageSizeInfo.cacheSize);
console.log("9-3. appSize : "+getPackageSizeInfo.appSize);
console.log("9-4. externalDataSize : "+getPackageSizeInfo.externalDataSize);
console.log("9-5. externalCacheSize : "+getPackageSizeInfo.externalCacheSize);
console.log("9-6. externalAppSize : "+getPackageSizeInfo.externalAppSize);

var getAppIdsFromPackage = getPackageInfo.getAppIdsFromPackage('all-app');
console.log("1-10. getAppIdsFromPackage() "+getAppIdsFromPackage);

var getCertInfo = getPackageInfo.getCertInfo();
console.log("1-11. getCertInfo() "+getCertInfo);
console.log("1-11-1. type "+getCertInfo.type);
console.log("1-11-2. value "+getCertInfo.value);

var getPrivilegeInfo = getPackageInfo.getPrivilegeInfo();
console.log("1-12. getPrivilegeInfo() "+getPrivilegeInfo);
console.log("1-12-1. name "+getPrivilegeInfo.name);
*/
