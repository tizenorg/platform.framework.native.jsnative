'use strict';

var TizenPackageManager = require('./tizen-package-manager_api.js');
console.log("%% tizen-package-manager "+TizenPackageManager);
var PackageManager = new TizenPackageManager.PackageManager();
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


var Request = new TizenPackageManager.Request();
console.log("\n0. Request() "+Request);

var install = Request.install('./pkgname.tpk');
console.log("1. install() "+install);
var uninstall = Request.uninstall('pkgname');
console.log("2. uninstall() "+uninstall);
var move = Request.move('pkgname', 'external');
console.log("3. move() "+move);
Request.type = "install";
console.log("4. type : "+Request.type);
Request.mode = "default";
console.log("5. mode : "+Request.mode);
Request.tep = "/home/owner/";
console.log("6. tep : "+Request.tep);


var PackageInfo = new TizenPackageManager.PackageInfo();
console.log("\n0. PackageInfo() "+PackageInfo);

var getAppIdsFromPackage = PackageInfo.getAppIdsFromPackage('ui-app');
console.log("1. getAppIdsFromPackage() "+getAppIdsFromPackage);
console.log("2. package : "+PackageInfo.package);
console.log("3. label : "+PackageInfo.label);
console.log("4. icon : "+PackageInfo.icon);
console.log("5. version : "+PackageInfo.version);
console.log("6. type : "+PackageInfo.type);
console.log("7. tepName : "+PackageInfo.tepName);
console.log("8. isSystemPackage : "+PackageInfo.isSystemPackage);
console.log("9. installedStorage : "+PackageInfo.installedStorage);
console.log("10. rootPath : "+PackageInfo.rootPath);
console.log("11. isRemovablePackage : "+PackageInfo.isRemovablePackage);
console.log("12. isPreloadPackage : "+PackageInfo.isPreloadPackage);
console.log("13. isAccessible : "+PackageInfo.isAccessible);
var getCertInfo = PackageInfo.getCertInfo();
console.log("14. getCertInfo() "+getCertInfo);
//console.log("14. getCertInfo() "+getCertInfo.type);
//console.log("14. getCertInfo() "+getCertInfo.value);
var getPrivilegeInfo = PackageInfo.getPrivilegeInfo();
console.log("15. getPrivilegeInfo() "+getPrivilegeInfo);
//console.log("15. getPrivilegeInfo() "+getPrivilegeInfo.name);


var PackageSizeInfo = new TizenPackageManager.PackageSizeInfo();
console.log("\n0. PackageSizeInfo() "+PackageSizeInfo);

console.log("1. dataSize : "+PackageSizeInfo.dataSize);
console.log("2. cacheSize : "+PackageSizeInfo.cacheSize);
console.log("3. appSize : "+PackageSizeInfo.appSize);
console.log("4. externalDataSize : "+PackageSizeInfo.externalDataSize);
console.log("5. externalCacheSize : "+PackageSizeInfo.externalCacheSize);
console.log("6. externalAppSize : "+PackageSizeInfo.externalAppSize);


var Filter = new TizenPackageManager.Filter();
console.log("\n0. Filter() "+Filter);

var addBooleanFilter = Filter.addBooleanFilter('property', 'value');
console.log("1. addBooleanFilter() "+addBooleanFilter);
console.log("2. addBooleanFilter() "+Filter.countPackageFilter);
var getPackageInfoFilter = Filter.getPackageInfoFilter();
console.log("3. getPackageInfoFilter() "+getPackageInfoFilter);

