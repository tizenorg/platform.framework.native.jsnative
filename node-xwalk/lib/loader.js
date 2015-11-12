// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var fs = require('fs');
var path = require('path');
var process = require('process');

var native_ = require("../build/Release/native.node");

function error(msg) {
  console.error("ERR: " + msg);
}

// Cached set of extension modules
var extensions_ = {};

var ExtensionModule = function(ext_name, ext_path) {
  this.extension_name = ext_name;
  this.extension_path = ext_path;
};

ExtensionModule.prototype.load = function() {
  this.extension_info = native_.getExtensionInfo(this.extension_path);
  if (!this.extension_info) {
    error('Error during get information of extension "' +
          this.extension_name + '"');
    return false;
  }

  if (this.extension_info.name !== this.extension_name) {
    error('Extension name does not match. ' +
          'required = ' + this.extension_name +
          ', loaded = ' + this.extension_info.name);
    return false;
  }

  this.instance_id = native_.createInstance(this.extension_info.extension_id);
  if (!this.instance_id) {
    error('Error during creating instance of extension "' +
          this.extension_name + '"');
    return false;
  }

  var jscode =
    '(function(extension) {' +
    '  extension.internal = { instance_id: extension.instance_id };' +
    '  extension.internal.sendSyncMessage = extension.sendSyncMessage;' +
    '  delete extension.sendSyncMessage;' +
    '  var exports = {}; ' +
    '  (function() {\'use strict\'; ' + this.extension_info.jsapi + '})();' +
    '  return exports;' +
    '});';
  try {
    var func = eval(jscode);
    this.instance = func({
      instance_id : this.instance_id,
      postMessage: function(msg) {
        native_.postMessage(this.instance_id, msg);
      },
      sendSyncMessage: function(msg) {
        return native_.sendSyncMessage(this.instance_id, msg);
      },
      setMessageListener: function(fn) {
        native_.setMessageListener(this.instance_id, fn);
      }
    });
    return true;
  } catch (err) {
    error('Error during loading extension "' +
          this.extension_name + '"');
    return false;
  }

  return false;
};

var ExtensionLoader = function() {
  this.extension_paths = [
    process.cwd(),
    path.join(process.cwd(), 'xwalk_extensions')
  ];
};

ExtensionLoader.prototype.findExtensionInPath = function(name) {
  for (var i in this.extension_paths) {
    var ext_path = path.join(this.extension_paths[i],
                             'lib' + name + '.so');
    try {
      fs.accessSync(ext_path, fs.R_OK);
      return ext_path;
    } catch (err) {
      continue;
    }
  }
  return undefined;
};

ExtensionLoader.prototype.setRuntimeVariable = function(key, value) {
  native_.setRuntimeVariable(key, value);
};

ExtensionLoader.prototype.require = function(name) {
  if (extensions_.hasOwnProperty(name)) {
    return extensions_[name].instance;
  }

  var ext_path = this.findExtensionInPath(name);
  if (!ext_path) {
    error('Can not find extension "' + name + '"');
    return undefined;
  }

  var ext = new ExtensionModule(name, ext_path);
  if (ext.load()) {
    extensions_[name] = ext;
    return extensions_[name].instance;
  }

  return undefined;
};

module.exports = new ExtensionLoader;
