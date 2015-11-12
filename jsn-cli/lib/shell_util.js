'use strict'

const Q = require('q');
const sh = require('shelljs');

const shellUtil = module.exports;

// This is utility function for easing usage of shell script command.
shellUtil.shExec = cmd => {
  const deferred = Q.defer();
  sh.exec(cmd, {async:true, silent:true}, (code) => {
    if (code != 0) deferred.reject(cmd + ' returns ' + code);
    else deferred.resolve(code);
  });
  return deferred.promise;
};