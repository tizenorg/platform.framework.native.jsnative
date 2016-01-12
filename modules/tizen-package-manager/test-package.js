'use strict';

var PackageManager = require('./tizen-package-manager_api.js');
console.log("111 "+PackageManager);
//var pkg = new PackageManager();
//console.log("222 "+pkg);
var pkginfo = PackageManager.getPackageInfo();
console.log("333 "+pkginfo)
