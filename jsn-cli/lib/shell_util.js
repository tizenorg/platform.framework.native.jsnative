(function() {
  'use strict';

  var Q = require('q');
  var sh = require('shelljs');

  var shellUtil = module.exports;

  // This is utility function for easing usage of shell script command.
  shellUtil.shExec = function(cmd) {
    var deferred = Q.defer();
    sh.exec(cmd, {async:true, silent:true}, function(code) {
      if (code !== 0) deferred.reject(cmd + ' returns ' + code);
      else deferred.resolve(code);
    });
    return deferred.promise;
  };
}());