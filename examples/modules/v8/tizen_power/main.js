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

var native_ = require('./build/Release/tizen_power_native');

var PowerResource = ['SCREEN', 'CPU'];
var PowerState = ['SCREEN_OFF',
                  'SCREEN_DIM',
                  'SCREEN_NORMAL',
                  'SCREEN_BRIGHT'];

function TizenPowerManager() {
  this.listener = null;
  native_.setScreenStateChangeListener(function(old_state, new_state) {
    if (this.listener) {
      this.listener(old_state, new_state);
    }
  });
}

TizenPowerManager.prototype.request = function(resource, state) {
  if (PowerResource.indexOf(resource) < 0 || PowerState.indexOf(state) < 0) {
    throw 'TypeMismatch Error';
  }

  return native_.request(resource, state);
};

TizenPowerManager.prototype.release = function(resource) {
  if (PowerResource.indexOf(resource) < 0) {
    throw 'TypeMismatch Error';
  }

  return native_.release(resource);
};

TizenPowerManager.prototype.setScreenStateChangeListener = function(listener) {
  this.listener = listener;
};

TizenPowerManager.prototype.unsetScreenStateChangeListener = function() {
  this.listener = null;
};

TizenPowerManager.prototype.getScreenBrightness = function() {
  return native_.getScreenBrightness();
};

TizenPowerManager.prototype.setScreenBrightness = function(brightness) {
  native_.setScreenBrightness(brightness);
};

TizenPowerManager.prototype.isScreenOn = function() {
  return native_.isScreenOn();
};

TizenPowerManager.prototype.restoreScreenBrightness = function() {
  native_.restoreScreenBrightness();
};

TizenPowerManager.prototype.turnScreenOn = function() {
  native_.setScreenState(true);
};

TizenPowerManager.prototype.turnScreenOff = function() {
  native_.setScreenState(false);
};

module.exports = new TizenPowerManager();
