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
    console.log(e.message);
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
          console.log("cb is not function");
        }
      } else {
        self.__event_handle__(msg);
      }
    };
  })(app);
  extension.setMessageListener(handler);
}


var APP_ID = Symbol();

/**
 * Called to get the Application Ids.
 * @class AppId
 */
class AppId {
  constructor(app_id) {
    console.log("@@@ AppId constructor()");
    this[APP_ID] = app_id;
  }

  /** OK
   * The id of the application
   * @attribute id
   * @readOnly
   **/
  get id() {
    console.log("@@@ get id attribute");
    return this[APP_ID];
  }
};


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
  constructor(pkg_id, pkg_label, pkg_iconpath, pkg_version, pkg_type,
              pkg_installedStorage, pkg_rootpath, pkg_systempackage, pkg_removable,
              pkg_preloaded, pkg_accessible, pkg_app_ids, pkg_privileges) {
    console.log("@@@ Package constructor()");
    this[PACKAGE_ID] = pkg_id;
    this[PACKAGE_LABEL] = pkg_label;
    this[PACKAGE_ICONPATH] = pkg_iconpath;
    this[PACKAGE_VERSION] = pkg_version;
    this[PACKAGE_TYPE] = pkg_type;
    this[PACKAGE_INSTALLED_STORAGE] = pkg_installedStorage;
    this[PACKAGE_ROOTPATH] = pkg_rootpath;
    this[PACKAGE_SYSTEM_PACKAGE] = pkg_systempackage;
    this[PACKAGE_REMOVABLE] = pkg_removable;
    this[PACKAGE_PRELOADED] = pkg_preloaded;
    this[PACKAGE_ACCESSIBLE] = pkg_accessible;
    this[PACKAGE_APP_IDS] = pkg_app_ids;
    this[PACKAGE_PRIVILEGES] = pkg_privileges;
  }

  /** OK
   * Gets the package id.
   * @attribute id
   * @readOnly
   **/
  get id() {
    console.log("@@@ get id attribute");
    return this[PACKAGE_ID];
  }

  /** OK
   * Gets the label of the package.
   * @attribute label
   * @readOnly
   **/
  get label() {
    console.log("@@@ get label attribute");
    return this[PACKAGE_LABEL];
  }

  /** OK
   * Gets the absolute path to the icon image.
   * @attribute iconPath
   * @readOnly
   **/
  get iconPath() {
    console.log("@@@ get iconPath attribute");
    return this[PACKAGE_ICONPATH];
  }

  /** OK
   * Gets the version of the package.
   * @attribute version
   * @readOnly
   **/
  get version() {
    console.log("@@@ get version attribute");
    return this[PACKAGE_VERSION];
  }

  /** OK
   * Gets the type of the package.
   * @attribute type
   * @readOnly
   **/
  get type() {
    console.log("@@@ get type attribute");
    return this[PACKAGE_TYPE];
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
    return this[PACKAGE_INSTALLED_STORAGE];
  }

  /** OK
   * Gets the root path of the package.
   * @attribute rootPath
   * @readOnly
   **/
  get rootPath() {
    console.log("@@@ get rootPath attribute");
    return this[PACKAGE_ROOTPATH];
  }

  /** OK
   * Checks whether the package is system package.
   * @attribute systemPackage
   * @readOnly
   **/
  get systemPackage() {
    console.log("@@@ get systemPackage attribute");
    return this[PACKAGE_SYSTEM_PACKAGE];
  }

  /** OK
   * Checks whether the package is removable.
   * @attribute removable
   * @readOnly
   **/
  get removable() {
    console.log("@@@ get removable attribute");
    return this[PACKAGE_REMOVABLE];
  }

  /** OK
   * Checks whether the package is preloaded.
   * @attribute preloaded
   * @readOnly
   **/
  get preloaded() {
    console.log("@@@ get preloaded attribute");
    return this[PACKAGE_PRELOADED];
  }

  /** OK
   * Checks whether the package info is accessible for the given package.
   * @attribute accessible
   * @readOnly
   **/
  get accessible() {
    console.log("@@@ get accessible attribute");
    return this[PACKAGE_ACCESSIBLE];
  }

  /** OK
   * Get all application IDs of each package.
   * @attribute appIds
   * @readOnly
   **/
  get appIds() {
    console.log("@@@ get appIds attribute");
    return this[PACKAGE_APP_IDS];
  }

  /** OK
   * Get privilege information of the package.
   * @attribute privileges
   * @readOnly
   **/
  get privileges() {
    console.log("@@@ get privileges attribute");
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
  constructor(size_data, size_cache, size_app, size_ext_data, size_ext_cache, size_ext_app) {
    console.log("@@@ PackageSize constructor()");
    this[PACKAGE_SIZE_DATA] = size_data;
    this[PACKAGE_SIZE_CACHE] = size_cache;
    this[PACKAGE_SIZE_APP] = size_app;
    this[PACKAGE_SIZE_EXTERNAL_DATA] = size_ext_data;
    this[PACKAGE_SIZE_EXTERNAL_CACHE] = size_ext_cache;
    this[PACKAGE_SIZE_EXTERNAL_APP] = size_ext_app;
  }

  /** OK
   * Retrieves data size from given handle.
   * @attribute data
   * @readOnly
   **/
  get data() {
    console.log("@@@ get data attribute");
    return this[PACKAGE_SIZE_DATA];
  }

  /** OK
   * Retrieves cache size from given handle.
   * @attribute cache
   * @readOnly
   **/
  get cache() {
    console.log("@@@ get cache attribute");
    return this[PACKAGE_SIZE_CACHE];
  }

  /** OK
   * Retrieves application size from given handle.
   * @attribute app
   * @readOnly
   **/
  get app() {
    console.log("@@@ get app attribute");
    return this[PACKAGE_SIZE_APP];
  }

  /** OK
   * Retrieves external data size from given handle.
   * @attribute externalData
   * @readOnly
   **/
  get externalData() {
    console.log("@@@ get externalData attribute");
    return this[PACKAGE_SIZE_EXTERNAL_DATA];
  }

  /** OK
   * Retrieves external cache size from given handle.
   * @attribute externalCache
   * @readOnly
   **/
  get externalCache() {
    console.log("@@@ get externalCache attribute");
    return this[PACKAGE_SIZE_EXTERNAL_CACHE];
  }

  /** OK
   * Retrieves external application size from given handle.
   * @attribute externalApp
   * @readOnly
   **/
  get externalApp() {
    console.log("@@@ get externalApp attribute");
    return this[PACKAGE_SIZE_EXTERNAL_APP];
  }
};


var available_keys = ['removable', 'readonly', 'supportDisable', 'disable', 'preload'];
var convert_key = {'removable': 'PACKAGE_MANAGER_PKGINFO_PROP_REMOVABLE',
                   'readonly': 'PACKAGE_MANAGER_PKGINFO_PROP_READONLY ',
                   'supportDisable': 'PACKAGE_MANAGER_PKGINFO_PROP_SUPPORT_DISABLE',
                   'disable': 'PACKAGE_MANAGER_PKGINFO_PROP_DISABLE',
                   'preload': 'PACKAGE_MANAGER_PKGINFO_PROP_PRELOAD'};

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
  }

  /** OK
   * Gets the package information for the given package.
   * @method getPackage
   * @param {String} packageId The ID of the package
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {PackageManager.Package} The package information for the given package ID
   * @throws
   * * TypeError
   * * QuotaExceededError
   * * NotPermittedError
   * * NotFoundError
   **/
  getPackage(packageId) {
    console.log("@@@ getPackage()");
    var args = {'packageId': packageId};
    var result = native_sync_call('getPackage', args);
    if (result['result'] == 'OK') {
      console.log("$$$ Success");
      var pkg = result['package'];
      return new Package(pkg['id'], pkg['label'], pkg['iconPath'], pkg['version'], pkg['type'],
                         pkg['installedStorage'], pkg['rootPath'], pkg['systemPackage'], pkg['removable'],
                         pkg['preloaded'], pkg['accessible'], pkg['appIds'], pkg['privileges']);
    } else {
      console.log("$$$ Error");
      return undefined;
    }
  }

  /** OK?
   * Retrieves all package information of installed packages.
   * @method getPackages
   * @param {object} [filter] optional
   * @async
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @return {Promise|PackageManager.Package[]}
   * @throws
   * * TypeError
   * * NotFoundError
   * * NotPermittedError
   **/
  getPackages(filter) {
    console.log("@@@ getPackages()");
    return new Promise(function(resolve, reject) {
      var args = {};
      if (filter) {
        var converted_filter = {};
        for (var key in filter) {
          if (available_keys.indexOf(key) != -1) {
            converted_filter[convert_key[key]] = filter[key];
          }
        }
        args['filter'] = converted_filter;
      }
      native_async_call('getPackages', args, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
          console.log("$$$ Error");
          return;
        }

        var packages = result['packages'].map(function(pkgs) {
          return new Package(pkgs['id'], pkgs['label'], pkgs['iconPath'], pkgs['version'], pkgs['type'],
                             pkgs['installedStorage'], pkgs['rootPath'], pkgs['systemPackage'], pkgs['removable'],
                             pkgs['preloaded'], pkgs['accessible'], pkgs['appIds'], pkgs['privileges']);
        });
        resolve(packages);
      });
    });
  }

  /** OK?
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
    console.log("@@@ getPackageSize()");
    return new Promise(function(resolve, reject) {
      var args = {'packageId': packageId};
      native_async_call('getPackageSize', args, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
          console.log("$$$ Error");
          return;
        }

        var packageSize = result['packageSize'].map(function(size) {
          return new PackageSize(size['data'], size['cache'], size['app'], size['extData'], size['extCache'], size['extApp']);
        });
        resolve(packageSize);
      });
    });
  }
};


exports = new PackageManager();


/*
var PackageManager = require('tizen-package-manager');
console.log("0. tizen-package-manager "+PackageManager);

var getPackage = PackageManager.getPackage('storage');
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
    console.log("2-2. label : "+packages[cnt].label);
    console.log("2-3. iconPath : "+packages[cnt].iconPath);
    console.log("2-4. version : "+packages[cnt].version);
    console.log("2-5. type : "+packages[cnt].type);
    console.log("2-6. systemPackage : "+packages[cnt].systemPackage);
    console.log("2-7. installedStorage : "+packages[cnt].installedStorage);
    console.log("2-8. rootPath : "+packages[cnt].rootPath);
    console.log("2-9. removable : "+packages[cnt].removable);
    console.log("2-10. preloaded : "+packages[cnt].preloaded);
    console.log("2-11. accessible : "+packages[cnt].accessible);
    for (var num1 in packages[cnt].appIds) {
      console.log("2-12. appIds : "+packages[cnt].appIds[num1]);
    }
    for (var num2 in packages[cnt].privileges) {
      console.log("2-13. privileges : "+packages[cnt].privileges[num2]);
    }
  }
}).catch(function(e){
  console.log(e.message);
});

PackageManager.getPackages({'preload': true})
.then(function(packages) {
  console.log("3. getPackages() "+packages.length);
  for (var cnt in packages) {
    console.log("3-1. id : "+packages[cnt].id);
    console.log("3-2. label : "+packages[cnt].label);
    console.log("3-3. iconPath : "+packages[cnt].iconPath);
    console.log("3-4. version : "+packages[cnt].version);
    console.log("3-5. type : "+packages[cnt].type);
    console.log("3-6. systemPackage : "+packages[cnt].systemPackage);
    console.log("3-7. installedStorage : "+packages[cnt].installedStorage);
    console.log("3-8. rootPath : "+packages[cnt].rootPath);
    console.log("3-9. removable : "+packages[cnt].removable);
    console.log("3-10. preloaded : "+packages[cnt].preloaded);
    console.log("3-11. accessible : "+packages[cnt].accessible);
    for (var num1 in packages[cnt].appIds) {
      console.log("3-12. appIds : "+packages[cnt].appIds[num1]);
    }
    for (var num2 in packages[cnt].privileges) {
      console.log("3-13. privileges : "+packages[cnt].privileges[num2]);
    }
  }
}).catch(function(e){
  console.log(e.message);
});

PackageManager.getPackageSize('storage')
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