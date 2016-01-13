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

'use strict';

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log('recevied message parse error:' + e.message);
    return {};
  }
}

var async_message_id = 0;
var async_map = new Map();

function native_async_call(method, parameter, cb) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  var asyncid = async_message_id++;
  args['asyncid'] = 'asyncid_' + asyncid;
  async_map.set(args['asyncid'], cb);
  extension.postMessage(JSON.stringify(args));
}

extension.setMessageListener(function(json) {
  var msg = JSON.parse(json);
  if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
    var cb = async_map.get(msg['asyncid']);
    async_map.delete(msg['asyncid']);
    if (cb instanceof Function) {
      cb(msg);
    } else {
      console.log('cb is not function');
    }
  }
});

var AppControl = require('tizen-app-control');
var util = require('util');


var internal_id = Symbol();
var internal_appcontrol = Symbol()
/**
 * @class Alarm
 */
class Alarm {
  constructor(id) {
    this[internal_id] = id;
  }

  /**
   * @attribute id
   * @type {string}
   * @readonly
   */
  get id() {
    return this[internal_id];
  }

  /**
   * @attribute isRecurrence
   * @type {bool}
   * @readonly
   */
  get isRecurrence() {
    return this.recurrenceWeeks.length > 0;
  }

  /**
   * @attribute recurrenceWeeks
   * @type {Array}
   * @readonly
   * * Sunday is 0 and saturday is 6
   */
  get recurrenceWeeks() {
    return native_sync_call('recurrenceWeeks', {'id': this.id})['data'];
  }

  /**
   * @attribute scheduleDate
   * @type {Date}
   * @readonly
   */
  get scheduleDate() {
    var result = native_sync_call('scheduleDate', {'id': this.id});
    if (result['result'] == 'OK') {
      return new Date(result['data']);
    }
    return undefined;
  }

  /**
   * @attribute appControl
   * @type {AppControl}
   * @readonly
   */
  get appControl() {
    if (this[internal_appcontrol]) {
      return this[internal_appcontrol];
    }
    var result = native_sync_call('appcontrol', {'id': this.id});
    if (result['result'] == 'OK') {
      var appcontrol = AppControl.FromJSON(result['data']);
      Object.freeze(appcontrol);
      return this[internal_appcontrol] = appcontrol;
    }
    return undefined;
  }
};

/**
 * @class AlarmManager
 */
class AlarmManager {
  constructor() {

  }

  /**
   * @method scheduleAfter
   * @param {AppControl} appcontrol
   * @param {number} afterInSecond
   * @param {string} optional targetAppID appid to receive alarm
   * @return {Alarm}
   */
  scheduleAfter(appcontrol, afterInSecond, targetAppID) {
    if (!appcontrol instanceof AppControl) {
      throw new TypeError('first argument was not AppControl instance');
    }
    if (!util.isNumber(afterInSecond)) {
      throw new TypeError('second argument was not Number');
    }
    afterInSecond = Math.floor(afterInSecond);
    var args = {};
    args['appcontrol'] = appcontrol.toJSON();
    args['after'] = afterInSecond;
    if (targetAppID) {
      args['target'] = targetAppID;
    }
    var result = native_sync_call('scheduleAfter', args);
    if (result['result'] != OK) {
      throw Error(result['reason']);
    }
    return new Alarm(result['id']);
  }

  /**
   * @method scheduleAtdate
   * @param {AppControl} appcontrol
   * @param {Date} date fired date
   * @param {object} config
   *  * weeks {Array} weeks array to recurrence
   *     * Sunday is 0 and saturday is 6
   *  * target {string} appid to receive alarm
   * @return {Alarm}
   */
  scheduleAtDate(appcontrol, date, config) {
    if (!appcontrol instanceof AppControl) {
      throw new TypeError('first argument was not AppControl instance');
    }
    if (!util.isDate(date)) {
      throw new TypeError('second argument was not Date');
    }
    var args = {};
    args['appcontrol'] = appcontrol.toJSON();
    args['date'] = date.getTime();
    if (config && util.isArray(config['weeks'])) {
      var weeks = [];
      for (var i = 0; i < config['weeks'].length; i++) {
        if (config['weeks'][i] >= 0 && config['weeks'][i] <= 6)
          weeks.push(config['weeks'][i]);
      }
      if (weeks.length > 0)
        args['weeks'] = weeks;
    }
    if (config && config['target']) {
      args['target'] = config['target'];
    }
    var result = native_sync_call('scheduleAtDate', args);
    if (result['result'] != OK) {
      throw Error(result['reason']);
    }
    return new Alarm(result['id']);
  }

  /**
   * @method removeAlarm
   * @param {string | Alarm} alarm
   */
  removeAlarm(alarm) {
    var id = alaram;
    if (alarm instanceof Alarm)
      id = alarm.id;
    native_sync_call('remove', {'id': id});
  }

  /**
   * @method removeAll
   */
  removeAll() {
    native_sync_call('removeAll');
  }

  /**
   * @method getAlarm
   * @param {string} id
   *
   * @return {Alarm}
   */
  getAlarm(id) {
    var result = native_sync_call('validation', {'id': id});
    if (result['result'] == 'OK')
      return new Alarm(id);
    else
      return undefined;
  }

  /**
   * @method getAlarms
   *
   * @return {Promise | [Alarm]}
   */
  getAlarms() {
    new Promise(function(resolve, reject) {
      native_async_call('getAlarms', undefined, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
          return;
        }
        var alarms = result['ids'].map(function(id) {
          return new Alarm(id);
        });
        resolve(alarms);
      });
    });
  }
};

exports = new AlarmManager();
