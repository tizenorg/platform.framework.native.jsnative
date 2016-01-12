'use strict';

var async_message_id = 0;
var async_map = new Map();

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log(e.message);
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

var enum = require('./tizen-package-manager_enumerations.js');
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
    super();
	registEventHandler(this);
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
    return new Promise(function(resolve, reject) {
      var args = {};
      args['argv'] = process.argv.slice(1);
      native_async_call('getPackagesInfo', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
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
    var args = {'appId': appId};
	return native_sync_call('getPackageIdByAppId', args);
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
    var args = {'packageId': packageId};
	return native_sync_call('getPackageInfo', args);
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
    var args = {};
	args['lhsPackageId'] = lhsPackageId;
	args['rhsPackageId'] = rhsPackageId;
	return native_sync_call('comparePackageCertInfo', args);
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
    var args = {};
	args['lhsAppId'] = lhsAppId;
	args['rhsAppId'] = rhsAppId;
	return native_sync_call('compareAppCertInfo', args);
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
    var args = {'appId': appId};
	return native_sync_call('isPreloadPackageByAppId', args);
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
    var args = {'appId': appId};
	return native_sync_call('getPermissionType', args);
  }

  /**
   * Clears the application's internal and external cache directory.
   * @method clearCacheDir
   * @param {String} packageId The package ID
   * @privilege http://tizen.org/privilege/packagemanager.clearcache
   **/
  clearCacheDir() {
    var args = {};
    args['argv'] = process.argv.slice(1);
	return native_sync_call('clearCacheDir', args);
  }

  /**
   * Clears all applications' internal and external cache directory.
   * @method clearAllCacheDir
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  clearAllCacheDir() {
    var args = {};
    args['argv'] = process.argv.slice(1);
	return native_sync_call('clearAllCacheDir', args);
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
    return new Promise(function(resolve, reject) {
      var args = {'packageId': packageId};
      native_async_call('getPackageSizeInfo', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
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
    return new Promise(function(resolve, reject) {
      var args = {};
      args['argv'] = process.argv.slice(1);
      native_async_call('getTotalPackageSizeInfo', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
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
    var args = {'responseData': responseData};
	return native_sync_call('requestDrmGenerateLicense', args);
  }

  /**
   * Registers encrypted license.
   * @method registerDrmLicense
   * @param {String} responseData The response data string of the rights request
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  registerDrmLicense(responseData) {
    var args = {'responseData': responseData};
	return native_sync_call('registerDrmLicense', args);
  }

  /**
   * Decrypts contents which is encrypted.
   * @method decryptDrmPackage
   * @param {String} drmFilePath DRM file path
   * @param {String} decryptedFilePath Decrypted file path
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  decryptDrmPackage(drmFilePath, decryptedFilePath) {
    var args = {};
	args['drmFilePath'] = drmFilePath;
	args['decryptedFilePath'] = decryptedFilePath;
	return native_sync_call('decryptDrmPackage', args);
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
}


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
    return native_sync_call('dataSize')['data'];
  }

  /**
   * Retrieves cache size from given handle.
   * @attribute cacheSize
   * @readOnly
   **/
  get cacheSize() {
    return native_sync_call('cacheSize')['data'];
  }

  /**
   * Retrieves application size from given handle.
   * @attribute appSize
   * @readOnly
   **/
  get appSize() {
    return native_sync_call('appSize')['data'];
  }

  /**
   * Retrieves external data size from given handle.
   * @attribute externalDataSize
   * @readOnly
   **/
  get externalDataSize() {
    return native_sync_call('externalDataSize')['data'];
  }

  /**
   * Retrieves external cache size from given handle.
   * @attribute externalCacheSize
   * @readOnly
   **/
  get externalCacheSize() {
    return native_sync_call('externalCacheSize')['data'];
  }

  /**
   * Retrieves external application size from given handle.
   * @attribute externalAppSize
   * @readOnly
   **/
  get externalAppSize() {
    return native_sync_call('externalAppSize')['data'];
  }
}


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
    super();
  }
  /**
   * This API adds a boolean filter property to the filter handle.
   * @method addBooleanFilter
   * @param {String} property boolean property name.
   * @param {Boolean} value value corresponding to the property.
   **/
  addBooleanFilter(property, value) {
    var args = {};
	args['property'] = property;
	args['value'] = value;
	return native_sync_call('addBooleanFilter', args);
  }

  /**
   * This API counts the package that satisfy the filter conditions.
   * @attribute countPackageFilter
   * @privilege http://tizen.org/privilege/packagemanager.info
   * @readOnly
   **/
  get countPackageFilter() {
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
    return new Promise(function(resolve, reject) {
      var args = {};
      args['argv'] = process.argv.slice(1);
      native_async_call('getPackageInfoFilter', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
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
    return native_sync_call('type')['data'];
  }

  /**
   * The certificate value of corresponding certificate key.
   * This value is base64 encoded data.
   * @attribute value
   * @readOnly
   **/
  get value() {
    return native_sync_call('value')['data'];
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
    return native_sync_call('name')['data'];
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
   * @since 3.0
   **/
  getAppIdsFromPackage(enum.componentType) {
    return new Promise(function(resolve, reject) {
      var args = {'componentType': enum.componentType};
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
    return native_sync_call('package')['data'];
  }

  /**
   * Gets the label of the package.
   * @attribute label
   * @readOnly
   **/
  get label() {
    return native_sync_call('label')['data'];
  }

  /**
   * Gets the absolute path to the icon image.
   * @attribute icon
   * @readOnly
   **/
  get icon() {
    return native_sync_call('icon')['data'];
  }

  /**
   * Gets the version of the package.
   * @attribute version
   * @readOnly
   **/
  get version() {
    return native_sync_call('version')['data'];
  }

  /**
   * Gets the type of the package.
   * @attribute type
   * @readOnly
   **/
  get type() {
    return native_sync_call('type')['data'];
  }

  /**
   * Gets the name of the TEP(Tizen Expansion Package).
   * @attribute tepName
   * @privilege http://tizen.org/privilege/packagemanager.admin
   * @readOnly
   **/
  get tepName() {
    return native_sync_call('tepName')['data'];
  }

  /**
   * Checks whether the package is system package.
   * @attribute isSystemPackage
   * @readOnly
   **/
  get isSystemPackage() {
    return native_sync_call('isSystemPackage')['data'];
  }

  /**
   * Gets the installed storage for the given package.
   * @attribute installedStorage
   * @value 'internal-storage' Internal storage
   * @value 'external-storage' External storage
   * @readOnly
   **/
  get installedStorage() {
    return native_sync_call('installedStorage')['data'];
  }

  /**
   * Gets the root path of the package.
   * @attribute rootPath
   * @readOnly
   **/
  get rootPath() {
    return native_sync_call('rootPath')['data'];
  }

  /**
   * Checks whether the package is removable.
   * @attribute isRemovablePackage
   * @readOnly
   **/
  get isRemovablePackage() {
    return native_sync_call('isRemovablePackage')['data'];
  }

  /**
   * Checks whether the package is preloaded.
   * @attribute isPreloadPackage
   * @readOnly
   **/
  get isPreloadPackage() {
    return native_sync_call('isPreloadPackage')['data'];
  }

  /**
   * Checks whether the package info is accessible for the given package.
   * @attribute isAccessible
   * @readOnly
   **/
  get isAccessible() {
    return native_sync_call('isAccessible')['data'];
  }

  /**
   * Retrieves certification information of the package.
   * @method getCertInfo
   * @async
   * @return {Promise|PackageManager.CertInfo}
   * @throws
   * * TypeError
   * * NotReadableError
   * @since 3.0
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
   * @since 3.0
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

/**
 * Creates a request handle to the package manager.
 * @namespace PackageManager
 * @class Request
 * @extends Node.EventEmitter
 * @constructor
 */
class Request extends EE {
  constructor() {
    super();
  }

  /**
   * Sets the type of the package to install, uninstall or update.
   * @attribute type
   * @type {String}
   **/
  get type() {
    return native_sync_call('type')['data'];
  }

  set type(value) {

  }

  /**
   * Sets the mode of the request.
   * @attribute mode
   * @value 'default' This is not for use by third-party applications. Default request mode
   * @value 'quiet' This is not for use by third-party applications. Quiet request mode
   **/
  get mode() {
    return native_sync_call('mode')['data'];
  }

  set mode(value) {

  }

  /**
   * Sets the path of TEP file to the request.
   * The TEP file that is set will be installed when the package is installed.
   * @attribute tep
   * @privilege http://tizen.org/privilege/packagemanager.admin
   **/
  get tep() {
    return native_sync_call('tep')['data'];
  }

  set tep(value) {

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
  move(name, enum.moveType) {
    return new Promise(function(resolve, reject) {
      var args = {};
	  args['name'] = name;
	  args['moveType'] = enum.moveType;
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

exports = new PackageManager();
