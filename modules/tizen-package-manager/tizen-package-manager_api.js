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
  var result = JSON.parse(resultString);
  try {
    return result;
  } catch (e) {
    console.error(e.message);
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
  extension.postMessage(JSON.stringify(args));
}

var PACKAGE_ID = Symbol();
var PACKAGE_LABEL = Symbol();
var PACKAGE_ICONPATH = Symbol();
var PACKAGE_VERSION = Symbol();
var PACKAGE_TYPE = Symbol();
var PACKAGE_INSTALLED_STORAGE = Symbol();
var PACKAGE_ROOTPATH = Symbol();
var PACKAGE_SYSTEM_PACKAGE = Symbol();
var PACKAGE_REMOVABLE = Symbol();
var PACKAGE_PRELOADED = Symbol();
var PACKAGE_ACCESSIBLE = Symbol();
var PACKAGE_APP_IDS = Symbol();
var PACKAGE_PRIVILEGES = Symbol();

/**
 * Gets the package information for the given package.
 * A instance of Package is created through the PackageManager.getPackage()
 * and PackageManager.getPackages() method.
 * @class Package
 * @constructor
 //* @param {String} packageId The ID of the package
 */
class Package {
  constructor(pkgId, pkgLabel, pkgIconPath, pkgVersion, pkgType,
              pkgInstalledStorage, pkgRootPath, pkgSystemPackage, pkgRemovable,
              pkgPreloaded, pkgAccessible, pkgAppIds, pkgPrivileges) {
    this[PACKAGE_ID] = pkgId;
    this[PACKAGE_LABEL] = pkgLabel;
    this[PACKAGE_ICONPATH] = pkgIconPath;
    this[PACKAGE_VERSION] = pkgVersion;
    this[PACKAGE_TYPE] = pkgType;
    this[PACKAGE_INSTALLED_STORAGE] = pkgInstalledStorage;
    this[PACKAGE_ROOTPATH] = pkgRootPath;
    this[PACKAGE_SYSTEM_PACKAGE] = pkgSystemPackage;
    this[PACKAGE_REMOVABLE] = pkgRemovable;
    this[PACKAGE_PRELOADED] = pkgPreloaded;
    this[PACKAGE_ACCESSIBLE] = pkgAccessible;
    this[PACKAGE_APP_IDS] = pkgAppIds;
    this[PACKAGE_PRIVILEGES] = pkgPrivileges;
  }

  /**
   * Gets the package id.
   * @attribute id
   * @readOnly
   **/
  get id() {
    return this[PACKAGE_ID];
  }

  /**
   * Gets the label of the package.
   * @attribute label
   * @readOnly
   **/
  get label() {
    return this[PACKAGE_LABEL];
  }

  /**
   * Gets the absolute path to the icon image.
   * @attribute iconPath
   * @readOnly
   **/
  get iconPath() {
    return this[PACKAGE_ICONPATH];
  }

  /**
   * Gets the version of the package.
   * @attribute version
   * @readOnly
   **/
  get version() {
    return this[PACKAGE_VERSION];
  }

  /**
   * Gets the type of the package.
   * @attribute type
   * @readOnly
   **/
  get type() {
    return this[PACKAGE_TYPE];
  }

  /**
   * Gets the installed storage for the given package.
   * @attribute installedStorage
   * @readOnly
   **/
  get installedStorage() {
    return this[PACKAGE_INSTALLED_STORAGE];
  }

  /**
   * Gets the root path of the package.
   * @attribute rootPath
   * @readOnly
   **/
  get rootPath() {
    return this[PACKAGE_ROOTPATH];
  }

  /**
   * Checks whether the package is system package.
   * @attribute systemPackage
   * @readOnly
   **/
  get systemPackage() {
    return this[PACKAGE_SYSTEM_PACKAGE];
  }

  /**
   * Checks whether the package is removable.
   * @attribute removable
   * @readOnly
   **/
  get removable() {
    return this[PACKAGE_REMOVABLE];
  }

  /**
   * Checks whether the package is preloaded.
   * @attribute preloaded
   * @readOnly
   **/
  get preloaded() {
    return this[PACKAGE_PRELOADED];
  }

  /**
   * Checks whether the package info is accessible for the given package.
   * @attribute accessible
   * @readOnly
   **/
  get accessible() {
    return this[PACKAGE_ACCESSIBLE];
  }

  /**
   * Get all application IDs of the package.
   * @attribute appIds
   * @readOnly
   **/
  get appIds() {
    return this[PACKAGE_APP_IDS];
  }

  /**
   * Get privilege information of the package.
   * @attribute privileges
   * @readOnly
   **/
  get privileges() {
    return this[PACKAGE_PRIVILEGES];
  }
};


var PACKAGE_SIZE_DATA = Symbol();
var PACKAGE_SIZE_CACHE = Symbol();
var PACKAGE_SIZE_APP = Symbol();
var PACKAGE_SIZE_EXTERNAL_DATA = Symbol();
var PACKAGE_SIZE_EXTERNAL_CACHE = Symbol();
var PACKAGE_SIZE_EXTERNAL_APP = Symbol();

/**
 * Called when the total package size information is obtained.
 * A instance of PackageSize is created through the PackageManager.getPackageSize()
 * @class PackageSize
 */
class PackageSize {
  constructor(sizeData, sizeCache, sizeApp, 
                sizeExtData, sizeExtCache, sizeExtApp) {
    this[PACKAGE_SIZE_DATA] = sizeData;
    this[PACKAGE_SIZE_CACHE] = sizeCache;
    this[PACKAGE_SIZE_APP] = sizeApp;
    this[PACKAGE_SIZE_EXTERNAL_DATA] = sizeExtData;
    this[PACKAGE_SIZE_EXTERNAL_CACHE] = sizeExtCache;
    this[PACKAGE_SIZE_EXTERNAL_APP] = sizeExtApp;
  }

  /**
   * Retrieves data size from given handle.
   * @attribute data
   * @readOnly
   **/
  get data() {
    return this[PACKAGE_SIZE_DATA];
  }

  /**
   * Retrieves cache size from given handle.
   * @attribute cache
   * @readOnly
   **/
  get cache() {
    return this[PACKAGE_SIZE_CACHE];
  }

  /**
   * Retrieves application size from given handle.
   * @attribute app
   * @readOnly
   **/
  get app() {
    return this[PACKAGE_SIZE_APP];
  }

  /**
   * Retrieves external data size from given handle.
   * @attribute externalData
   * @readOnly
   **/
  get externalData() {
    return this[PACKAGE_SIZE_EXTERNAL_DATA];
  }

  /**
   * Retrieves external cache size from given handle.
   * @attribute externalCache
   * @readOnly
   **/
  get externalCache() {
    return this[PACKAGE_SIZE_EXTERNAL_CACHE];
  }

  /**
   * Retrieves external application size from given handle.
   * @attribute externalApp
   * @readOnly
   **/
  get externalApp() {
    return this[PACKAGE_SIZE_EXTERNAL_APP];
  }
};


var availableKeys = 
    ['removable', 'readonly', 'supportDisable', 'disable', 'preload'];
var convertKey = 
    {'removable': 'PACKAGE_MANAGER_PKGINFO_PROP_REMOVABLE',
     'readonly': 'PACKAGE_MANAGER_PKGINFO_PROP_READONLY ',
     'supportDisable': 'PACKAGE_MANAGER_PKGINFO_PROP_SUPPORT_DISABLE',
     'disable': 'PACKAGE_MANAGER_PKGINFO_PROP_DISABLE',
     'preload': 'PACKAGE_MANAGER_PKGINFO_PROP_PRELOAD'};

/**
 * Creates a package manager handle.
 * @class PackageManager
 * @privilege http://tizen.org/privilege/packagemanager.info
 */
class PackageManager {

  /**
   * Gets the package information for the given package.
   * @method getPackage
   * @param {String} packageId The ID of the package
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Promise|PackageManager.Package}
   * @throws
   * * TypeError
   * * QuotaExceededError
   * * NotPermittedError
   * * NotFoundError
   **/
  getPackage(packageId) {
    return new Promise(function(resolve, reject) {
      var args = {'packageId': packageId};
      native_async_call('getPackage', args, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
        }

        var pkg = result['package'].map(function(pkg) {
          return new Package(pkg['id'], pkg['label'],
		  	                 pkg['iconPath'], pkg['version'],
		  	                 pkg['type'], pkg['installedStorage'],
                             pkg['rootPath'], pkg['systemPackage'],
                             pkg['removable'], pkg['preloaded'],
                             pkg['accessible'], pkg['appIds'],
                             pkg['privileges']);
        });
		console.log("################"+pkg['id']);
		console.log("################"+pkg['label']);
		console.log("################"+pkg['iconPath']);
		console.log("################"+pkg['version']);
		console.log("################"+pkg['type']);
		console.log("################"+pkg['installedStorage']);
		console.log("################"+pkg['rootPath']);
		console.log("################"+pkg['systemPackage']);
		console.log("################"+pkg['removable']);
		console.log("################"+pkg['preloaded']);
		console.log("################"+pkg['accessible']);
		console.log("################"+pkg['appIds']);
		console.log("################"+pkg['privileges']);
        resolve(pkg);
      });
    });
  }  

  /**
   * Retrieves all package information of installed packages.
   * @method getPackages
   * @param {object} [filter]
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Promise|PackageManager.Package[]}
   * @throws
   * * TypeError
   * * NotFoundError
   * * NotPermittedError
   **/
  getPackages(filter) {
    return new Promise(function(resolve, reject) {
      var args = {};
      if (filter) {
        var converted_filter = {};
        for (var key in filter) {
          if (availableKeys.indexOf(key) != -1) {
            converted_filter[convertKey[key]] = filter[key];
          }
        }
        args['filter'] = converted_filter;
      }
      native_async_call('getPackages', args, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
        }

        var pkgs = result['packages'].map(function(pkgs) {
          return new Package(pkgs['id'], pkgs['label'],
		  	                 pkgs['iconPath'], pkgs['version'],
		  	                 pkgs['type'], pkgs['installedStorage'],
		  	                 pkgs['rootPath'], pkgs['systemPackage'],
		  	                 pkgs['removable'], pkgs['preloaded'],
		  	                 pkgs['accessible'], pkgs['appIds'],
		  	                 pkgs['privileges']);
        });
        resolve(pkgs);
      });
    });
  }

  /**
   * Gets the package size information.
   * The package size info is asynchronously obtained by the callback function.
   * @method getPackageSize
   * @param {String} packageId The package ID
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Promise|PackageManager.PackageSize}
   * @throws
   * * TypeError
   * * NotFoundError
   * * NotPermittedError
   * * QuotaExceededError
   * * NotReadableError
   **/
  getPackageSize(packageId) {
    return new Promise(function(resolve, reject) {
      var args = {'packageId': packageId};
      native_async_call('getPackageSize', args, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
        }

        var pkgSize = result['packageSize'];
        resolve(new PackageSize(pkgSize['data'], pkgSize['cache'],
			                    pkgSize['app'], pkgSize['externalData'],
			                    pkgSize['externalCache'], pkgSize['externalApp']));
      });
    });
  }
};


exports = new PackageManager();


/*
var PackageManager = require('tizen-package-manager');
console.log("0. tizen-package-manager "+PackageManager);

var getPackage = PackageManager.getPackage('pkgname');
console.log("1. getPackage() "+getPackage);
console.log("1-1. id : "+getPackage.id);
console.log("1-2. label : "+getPackage.label);
console.log("1-3. iconPath : "+getPackage.iconPath);
console.log("1-4. version : "+getPackage.version);
console.log("1-5. type : "+getPackage.type);
console.log("1-6. systemPackage : "+getPackage.systemPackage);
console.log("1-7. installedStorage : "+getPackage.installedStorage);
console.log("1-8. rootPath : "+getPackage.rootPath);
console.log("1-9. removable : "+getPackage.removable);
console.log("1-10. preloaded : "+getPackage.preloaded);
console.log("1-11. accessible : "+getPackage.accessible);
for (var cnt in getPackage.appIds) {
  console.log("1-12. appIds : "+getPackage.appIds[cnt]);
}
for (var cnt in getPackage.privileges) {
  console.log("1-13. privileges : "+getPackage.privileges[cnt]);
}

PackageManager.getPackages()
.then(function(packages) {
  console.log("2. getPackages() "+packages);
  for (var cnt in packages) {
    console.log("2-1. id : "+packages[cnt].id);
    //console.log("2-2. label : "+packages[cnt].label);
    //console.log("2-3. iconPath : "+packages[cnt].iconPath);
    //console.log("2-4. version : "+packages[cnt].version);
    //console.log("2-5. type : "+packages[cnt].type);
    //console.log("2-6. systemPackage : "+packages[cnt].systemPackage);
    //console.log("2-7. installedStorage : "+packages[cnt].installedStorage);
    //console.log("2-8. rootPath : "+packages[cnt].rootPath);
    //console.log("2-9. removable : "+packages[cnt].removable);
    //console.log("2-10. preloaded : "+packages[cnt].preloaded);
    //console.log("2-11. accessible : "+packages[cnt].accessible);
    //for (var num1 in packages[cnt].appIds) {
      //console.log("2-12. appIds : "+packages[cnt].appIds[num1]);
    //}
    //for (var num2 in packages[cnt].privileges) {
      //console.log("2-13. privileges : "+packages[cnt].privileges[num2]);
    //}
  }
}).catch(function(e){
  console.log(e.message);
});

PackageManager.getPackages({'preload': true})
.then(function(packages) {
  console.log("3. getPackages() "+packages);
  for (var cnt in packages) {
    //console.log("3-1. id : "+packages[cnt].id);
    //console.log("3-2. label : "+packages[cnt].label);
    //console.log("3-3. iconPath : "+packages[cnt].iconPath);
    //console.log("3-4. version : "+packages[cnt].version);
    //console.log("3-5. type : "+packages[cnt].type);
    //console.log("3-6. systemPackage : "+packages[cnt].systemPackage);
    //console.log("3-7. installedStorage : "+packages[cnt].installedStorage);
    //console.log("3-8. rootPath : "+packages[cnt].rootPath);
    //console.log("3-9. removable : "+packages[cnt].removable);
    console.log("3-10. preloaded : "+packages[cnt].preloaded);
    //console.log("3-11. accessible : "+packages[cnt].accessible);
    for (var num1 in packages[cnt].appIds) {
      //console.log("3-12. appIds : "+packages[cnt].appIds[num1]);
    }
    for (var num2 in packages[cnt].privileges) {
      //console.log("3-13. privileges : "+packages[cnt].privileges[num2]);
    }
  }
}).catch(function(e){
  console.log(e.message);
});

PackageManager.getPackageSize('pkgname')
.then(function(packageSize) {
  console.log("4. getPackageSize() "+packageSize);
  console.log("4-1. data : "+packageSize.data);
  console.log("4-2. cache : "+packageSize.cache);
  console.log("4-3. app : "+packageSize.app);
  console.log("4-4. externalData : "+packageSize.externalData);
  console.log("4-5. externalCache : "+packageSize.externalCache);
  console.log("4-6. externalApp : "+packageSize.externalApp);
}).catch(function(e){
  console.log(e.message);
});
*/
