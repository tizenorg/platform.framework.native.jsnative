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


/**
 * The tizen alarm module
 *
 * ```
 * var AppControl = require('tizen-app-control');
 * var app = require('tizen-application');
 * var alarm_manager = require('alarm-manager');
 * var appcontrol = new AppControl(AppControl.OPERATION_VIEW);
 * alarm_manager.scheduleAfter(app.id, appcontrol, 60);
 *
 * ```
 * @module tizen-alarm
 *
 */



var internal_id = Symbol();
var internal_appcontrol = Symbol();
/**
 * @class Alarm
 *
 * The class of alarm data
 */
class Alarm {
  constructor(id) {
    this[internal_id] = id;
  }

  /**
   * Identifier of alarm
   * @attribute id
   * @type {string}
   * @readonly
   */
  get id() {
    return this[internal_id];
  }

  /**
   * @attribute isRecurrence
   * @type {boolean}
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
    if (result['result'] === 'OK') {
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
    if (result['result'] === 'OK') {
      var appcontrol = AppControl.FromJSON(result['data']);
      Object.freeze(appcontrol);
      this[internal_appcontrol] = appcontrol;
      return appcontrol;
    }
    return undefined;
  }
};

/**
 * @class AlarmManager
 * The AlarmManager class provides methods to manage alarms.
 */
class AlarmManager {
  constructor() {

  }

  /**
   * Sets an alarm to be triggered after a specific time.
   * The alarm will go off @a delay seconds later.
   * To cancel the alarm, call removeAlarm() with @a Alarm.
   * @method scheduleAfter
   * @param {string} targetAppId AppID to launch
   * @param {AppControl} appcontrol
   * @param {number} afterInSecond
   * @param {string} optional targetAppID appid to receive alarm
   * @return {Alarm}
   * @privilege http://tizen.org/privilege/alarm.set
   * @throws
   *  * Error - Fail to add alarm
   */
  scheduleAfter(targetAppID, appcontrol, afterInSecond) {
    if (!(appcontrol instanceof AppControl)) {
      throw new TypeError('first argument was not AppControl instance');
    }
    if (!util.isNumber(afterInSecond)) {
      throw new TypeError('second argument was not Number');
    }
    afterInSecond = Math.floor(afterInSecond);
    var args = {};
    args['target'] = targetAppID;
    args['appcontrol'] = appcontrol.toJSON();
    args['after'] = afterInSecond;

    var result = native_sync_call('scheduleAfter', args);
    if (result['result'] !== 'OK') {
      throw Error(result['reason']);
    }
    return new Alarm(result['id']);
  }

  /**
   * Sets an alarm to be triggered at a specific time.
   * The @a date describes the time of the first occurrence.
   * To cancel the alarm, call removeAlarm() with @a Alarm.
   * @method scheduleAtdate
   * @param {string} targetAppId AppID to launch
   * @param {AppControl} appcontrol
   * @param {Date} date fired date
   * @param {Array} recurrenceWeeks weeks array to recurrence
   *  * Sunday is 0 and saturday is 6
   * @return {Alarm}
   * @privilege http://tizen.org/privilege/alarm.set
   * @throws
   *  * Error - Fail to add alarm
   */
  scheduleAtDate(targetAppID, appcontrol, date, recurrenceWeeks) {
    if (!(appcontrol instanceof AppControl)) {
      throw new TypeError('first argument was not AppControl instance');
    }
    if (!util.isDate(date)) {
      throw new TypeError('second argument was not Date');
    }
    var args = {};
    args['target'] = targetAppID;
    args['appcontrol'] = appcontrol.toJSON();
    args['date'] = date.getTime();
    if (util.isArray(recurrenceWeeks)) {
      var weeks = [];
      for (var i = 0; i < recurrenceWeeks.length; i++) {
        if (recurrenceWeeks[i] >= 0 && recurrenceWeeks[i] <= 6)
          weeks.push(recurrenceWeeks[i]);
      }
      if (weeks.length > 0)
        args['weeks'] = weeks;
    }
    var result = native_sync_call('scheduleAtDate', args);
    if (result['result'] !== 'OK') {
      throw Error(result['reason']);
    }
    return new Alarm(result['id']);
  }

  /**
   * Remove alarm
   * @method removeAlarm
   * @param {string | Alarm} alarm instance or alarm.id
   * @privilege http://tizen.org/privilege/alarm.set
   */
  removeAlarm(alarm) {
    var id = alarm;
    if (alarm instanceof Alarm)
      id = alarm.id;
    native_sync_call('remove', {'id': id});
  }

  /**
   * Remove all alarms
   * @method removeAll
   * @privilege http://tizen.org/privilege/alarm.set
   */
  removeAll() {
    native_sync_call('removeAll');
  }

  /**
   * Get alarm
   * @method getAlarm
   * @param {string} id
   * @privilege http://tizen.org/privilege/alarm.set
   * @return {Alarm} if does not existed, undefined was returned
   */
  getAlarm(id) {
    var result = native_sync_call('validation', {'id': id});
    if (result['result'] === 'OK')
      return new Alarm(id);
    else
      return undefined;
  }

  /**
   * Get all alarms
   * @method getAlarms
   * @privilege http://tizen.org/privilege/alarm.set
   * @return {Promise | Alarm[]} Array of Alarm
   */
  getAlarms() {
    return new Promise(function(resolve, reject) {
      native_async_call('getAlarms', undefined, function(result) {
        if (result['reason']) {
          reject(new Error(result['reason']));
          return;
        }
        var alarms = result['data'].map(function(id) {
          return new Alarm(id);
        });
        resolve(alarms);
      });
    });
  }
};

exports = new AlarmManager();
