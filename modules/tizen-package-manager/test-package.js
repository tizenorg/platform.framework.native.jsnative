'use strict';

var PackageManager = require('./tizen-package-manager_api.js').PackageManager;
console.log("0. PackageManager() "+PackageManager);

var getPackagesInfo = PackageManager.getPackagesInfo();
console.log("1. getPackagesInfo() "+getPackagesInfo);
var getPackageIdByAppId = PackageManager.getPackageIdByAppId('appname01');
console.log("2. getPackageIdByAppId() "+getPackageIdByAppId);
var getPackageInfo = PackageManager.getPackageInfo('pkgname');
console.log("3. getPackageInfo() "+getPackageInfo);
var comparePackageCertInfo = PackageManager.comparePackageCertInfo('pkgname', 'pkgname');
console.log("4. comparePackageCertInfo() "+comparePackageCertInfo);
var compareAppCertInfo = PackageManager.compareAppCertInfo('appname01', 'appname01');
console.log("5. compareAppCertInfo() "+compareAppCertInfo);
var isPreloadPackageByAppId = PackageManager.isPreloadPackageByAppId('appname01');
console.log("6. isPreloadPackageByAppId() "+isPreloadPackageByAppId);
var getPermissionType = PackageManager.getPermissionType('appname01');
console.log("7. getPermissionType() "+getPermissionType);
var clearCacheDir = PackageManager.clearCacheDir();
console.log("8. clearCacheDir() "+clearCacheDir);
var clearAllCacheDir = PackageManager.clearAllCacheDir();
console.log("9. clearAllCacheDir() "+clearAllCacheDir);
var getPackageSizeInfo = PackageManager.getPackageSizeInfo('pkgname');
console.log("10. getPackageSizeInfo() "+getPackageSizeInfo);
var getTotalPackageSizeInfo = PackageManager.getTotalPackageSizeInfo();
console.log("11. getTotalPackageSizeInfo() "+getTotalPackageSizeInfo);
var requestDrmGenerateLicense = PackageManager.requestDrmGenerateLicense('responseData');
console.log("12. requestDrmGenerateLicense() "+requestDrmGenerateLicense);
var registerDrmLicense = PackageManager.registerDrmLicense('responseData');
console.log("13. registerDrmLicense() "+registerDrmLicense);
var decryptDrmPackage = PackageManager.decryptDrmPackage('drmFilePath', 'decryptedFilePath');
console.log("14. decryptDrmPackage() "+decryptDrmPackage);


var Request = require('./tizen-package-manager_api.js').Request;
var req = new Request();
console.log("\n0. Request() "+req);

var install = req.install('./pkgname.tpk');
console.log("1. install() "+install);
var uninstall = req.uninstall('pkgname');
console.log("2. uninstall() "+uninstall);
var move = req.move('pkgname', 'external');
console.log("3. move() "+move);
req.type = "install";
console.log("4. type : "+req.type);
req.mode = "default";
console.log("5. mode : "+req.mode);
req.tep = "/home/owner/";
console.log("6. tep : "+req.tep);


var PackageInfo = require('./tizen-package-manager_api.js').PackageInfo;
var pkginfo = new PackageInfo();
console.log("\n0. PackageInfo() "+pkginfo);

var getAppIdsFromPackage = pkginfo.getAppIdsFromPackage('ui-app');
console.log("1. getAppIdsFromPackage() "+getAppIdsFromPackage);
console.log("2. package : "+pkginfo.package);
console.log("3. label : "+pkginfo.label);
console.log("4. icon : "+pkginfo.icon);
console.log("5. version : "+pkginfo.version);
console.log("6. type : "+pkginfo.type);
console.log("7. tepName : "+pkginfo.tepName);
console.log("8. isSystemPackage : "+pkginfo.isSystemPackage);
console.log("9. installedStorage : "+pkginfo.installedStorage);
console.log("10. rootPath : "+pkginfo.rootPath);
console.log("11. isRemovablePackage : "+pkginfo.isRemovablePackage);
console.log("12. isPreloadPackage : "+pkginfo.isPreloadPackage);
console.log("13. isAccessible : "+pkginfo.isAccessible);
var getCertInfo = pkginfo.getCertInfo();
console.log("14. getCertInfo() "+getCertInfo.type);
console.log("14. getCertInfo() "+getCertInfo.value);
var getPrivilegeInfo = pkginfo.getPrivilegeInfo();
console.log("15. getPrivilegeInfo() "+getPrivilegeInfo.name);


var PackageSizeInfo = require('./tizen-package-manager_api.js').PackageSizeInfo;
var pkgsizeinfo = new PackageSizeInfo();
console.log("\n0. PackageSizeInfo() "+pkgsizeinfo);

console.log("1. dataSize : "+pkgsizeinfo.dataSize);
console.log("2. cacheSize : "+pkgsizeinfo.cacheSize);
console.log("3. appSize : "+pkgsizeinfo.appSize);
console.log("4. externalDataSize : "+pkgsizeinfo.externalDataSize);
console.log("5. externalCacheSize : "+pkgsizeinfo.externalCacheSize);
console.log("6. externalAppSize : "+pkgsizeinfo.externalAppSize);


var Filter = require('./tizen-package-manager_api.js').Filter;
var filter = new Filter();
console.log("\n0. Filter() "+filter);

var addBooleanFilter = filter.addBooleanFilter('property', 'value');
console.log("1. addBooleanFilter() "+addBooleanFilter);
console.log("2. addBooleanFilter() "+filter.countPackageFilter);
var getPackageInfoFilter = filter.getPackageInfoFilter();
console.log("3. getPackageInfoFilter() "+getPackageInfoFilter);
