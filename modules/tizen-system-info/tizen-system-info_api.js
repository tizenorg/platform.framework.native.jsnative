/*
 * Copyright (c) 2016 Samsung Electronics Co., Ltd All Rights Reserved
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

/**
 * The System Information module provides functions which can be used to obtain
 * system information such as the platform versions, device model number,
 * supported device features, and device screen dimensions.
 * ```
 * var systemInfo = require('tizen-system-info');
 * ```
 * @module tizen-system-info
 */

'use strict';


function callSync(cmd, args) {
  var obj = {};
  obj['cmd'] = cmd;
  obj = Object.assign(obj, args);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(obj)));
  } catch (e) {
    console.err(e.message);
    return {};
  }
}

function getValue(scope, key) {
  var ret = callSync('systeminfo.getValue', {scope: scope, key: key});
  if (!ret || typeof ret !== 'object') {
    return;
  }
  var type = ret['type'];
  var value = ret['value'];
  if (type && value) {
    if (type === 'bool') {
      return Boolean(value);
    } else if (type === 'int' || type === 'double') {
      return Number(value);
    } else {
      return value;
    }
  }
}

/**
 * The SystemInfo class provides functions which can be used to obtaion system
 * informations.
 *
 * The keys and their value's types are described at
 * [The list of Tizen Feature Keys](https://developer.tizen.org/development/guides/native-application/system/system-information).
 * ```
 * var systemInfo = require('tizen-system-info');
 * var feature = 'http://tizen.org/feature/camera';
 * var value = systemInfo.getPlatformFeatureValue(feature);
 * if (typeof value === 'boolean') {
 *   console.log('Feature is supported');
 * } else {
 *   console.log('Feature value : ' + value);
 * }
 * ```
 * @class SystemInfo
 * @since 3.0
 */
class SystemInfo {

  /**
   * Gets the value of the platform feature.
   *
   * @method getPlatformFeatureValue
   * @param {String} key Platform feature key string
   * @return {Boolean | Number | String} The value of the requested platform
   *         feature. Type depends on the key of the feature.
   * @since 3.0
   */
  getPlatformFeatureValue(key) {
    if (typeof key === 'string') {
      return getValue('platform', key);
    }
  }

  /**
   * Gets the value of the custom feature.
   *
   * @method getCustomFeatureValue
   * @param {String} key Custom feature key string
   * @return {Boolean | Number | String} The value of the requested custom
   *         feature. Type depends on the key of the feature.
   * @since 3.0
   */
  getCustomFeatureValue(key) {
    if (typeof key === 'string') {
      return getValue('custom', key);
    }
  }
};

exports = new SystemInfo();
