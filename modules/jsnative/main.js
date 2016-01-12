/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd All Rights Reserved
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

var JSNative = function() {
};

JSNative._Initialize = function() {
  // Install node-xwalk
  // - After install 'node-xwalk', Crosswalk extensions can be loaded using
  //   require() function. eg: require('foo.xwalk')
  require('node-xwalk').install();

  // Install dlog functions to console.xxx
  var tag = 'JSNative';
  var dlog = require('node-dlog');
  var util = require('util');
  console.log = function() {
    dlog.logd(tag, util.format.apply(this, arguments));
  };
  console.info = function() {
    dlog.logv(tag, util.format.apply(this, arguments));
  };
  console.error = function() {
    dlog.loge(tag, util.format.apply(this, arguments));
  };
  console.warn = console.info;
  console.logd = function() {
    if (arguments.length > 1) {
      dlog.logd(
          arguments[0],
          util.format.apply(this, Array.prototype.slice.call(arguments, 1)));
    } else {
      dlog.logd(util.format.apply(this, arguments));
    }
  };
  console.logv = function() {
    if (arguments.length > 1) {
      dlog.logv(
          arguments[0],
          util.format.apply(this, Array.prototype.slice.call(arguments, 1)));
    } else {
      dlog.logv(util.format.apply(this, arguments));
    }
  };
  console.loge = function() {
    if (arguments.length > 1) {
      dlog.loge(
          arguments[0],
          util.format.apply(this, Array.prototype.slice.call(arguments, 1)));
    } else {
      dlog.loge(util.format.apply(this, arguments));
    }
  };
};

JSNative._Initialize();

module.exports = new JSNative();
