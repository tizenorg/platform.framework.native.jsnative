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

var util = require('util');
var EventEmitter = require('events');

var map = new WeakMap();
var internal = function (object) {
  if (!map.has(object))
    map.set(object, {});
  return map.get(object);
}

var Application = function() {
  EventEmitter.call(this);
  internal(this).initialized = false;
};

util.inherits(Application, EventEmitter);

Application.prototype.init = function(name) {
  if (internal(this).initialized)
    return;
  internal(this).initialized = true;
  process.title = process.argv[1];

  var appfw = require('../build/Release/appfw_native');
  var EventEmitter = require('events');

  // gcontext module should be installed as global module
  require('gcontext').init();

  process.on('exit', function(){
    appfw.deinit();
  });

  appfw.onCreate = (function(self){
    return self.emit.bind(self, ['create']);
  })(this);

  appfw.onService = (function(self){
    return self.emit.bind(self, ['service']);
  })(this);

  appfw.onPause = (function(self){
    return self.emit.bind(self, ['pause']);
  })(this);

  appfw.onResume = (function(self){
    return self.emit.bind(self, ['resume']);
  })(this);

  appfw.onTerminate = (function(self){
    return self.emit.bind(self, ['terminate']);
  })(this);

  appfw.init(process.argv.slice(1));
}

Application.prototype.exit = function(code) {
  process.exit(code);
}

module.exports = new Application();
