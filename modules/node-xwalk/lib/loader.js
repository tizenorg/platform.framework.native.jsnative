// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function error(msg) {
  require('node-dlog').loge('node-xwalk: ' + msg);
}

// Cached set of extension modules
var extensions_ = {};

var ExtensionModule = function(ext_path) {
  this.extension_path = ext_path;
};

ExtensionModule.prototype.load = function() {
  var native_ = require("../build/Release/node-xwalk-native");
  this.extension_info = native_.getExtensionInfo(this.extension_path);
  if (!this.extension_info) {
    error('Error during get information of extension "' +
          this.extension_path + '"');
    return false;
  }

  this.instance_id = native_.createInstance(this.extension_info.extension_id);
  if (!this.instance_id) {
    error('Error during creating instance of extension "' +
          this.extension_path + '"');
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
          this.extension_path + '"');
    return false;
  }

  return false;
};

var ExtensionLoader = function() {
  var process = require('process');
  this.extension_paths = [
    process.cwd(),
    require('path').join(process.cwd(), 'xwalk_extensions')
  ];
};

ExtensionLoader.prototype.findExtensionInPath = function(name) {
  var fs = require('fs');
  var path = require('path');

  if (path.isAbsolute(name)) {
    try {
      fs.accessSync(name, fs.R_OK);
      return name;
    } catch (err) {
      return undefined;
    }
  }

  for (var i in this.extension_paths) {
    var try_files = [
      path.join(this.extension_paths[i], name),
      path.join(this.extension_paths[i], name + '.xwalk'),
      path.join(this.extension_paths[i], 'lib' + name + '.so')
    ];

    for (var j in try_files) {
      try {
        fs.accessSync(try_files[j], fs.R_OK);
        return try_files[j];
      } catch (err) {
        continue;
      }
    }
  }
  return undefined;
};

ExtensionLoader.prototype.setRuntimeVariable = function(key, value) {
  var native_ = require("../build/Release/native");
  native_.setRuntimeVariable(key, value);
};

ExtensionLoader.prototype.require = function(name) {
  var ext_path = this.findExtensionInPath(name);
  if (!ext_path) {
    error('Can not find extension "' + name + '"');
    return undefined;
  }

  if (extensions_.hasOwnProperty(ext_path)) {
    return extensions_[ext_path].instance;
  }

  var ext = new ExtensionModule(ext_path);
  if (ext.load()) {
    extensions_[ext_path] = ext;
    return extensions_[ext_path].instance;
  }

  return undefined;
};

ExtensionLoader.prototype.install = function() {
  require.extensions['.xwalk'] = function(module, filename) {
    module.exports = require('node-xwalk').require(filename);
  };
};

module.exports = new ExtensionLoader();
