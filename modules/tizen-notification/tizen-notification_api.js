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
 * The Tizen Native JS Notification Module.
 *
 * ```
 * var AppControl = require('tizen-app-control');
 * var appControl = new AppControl(AppControl.OPERATION_DEFAULT);
 *
 * var Manager = require('tizen-notification');
 * var dictionary1 = { 'title': 'Noti1',
 *                     'content': 'Noti1 content',
 *                   };
 *
 * // Notification 1
 * var myNoti1 = new Manager.Notification(dictionary1);
 * var ledBlinkPeriod = {'ledOnPeriod': 110, 'ledOffPeriod': 100};
 * myNoti1.setLed("LED_ON", ledBlinkPeriod);
 * myNoti1.setAction(appControl, "org.tizen.message");
 * Manager.post(myNoti1);
 * console.log('The pkgname of myNoti1 is : ' + Manager.getPkgname(myNoti1.id));
 * console.log('Insertion time of myNoti1: ' + myNoti1.insertTime);
 *   // Insertion time of myNoti1: Thu Jan 08 2015 08:50:32 GMT+0900 (KST)
 * var ledInfo = myNoti1.getLed();
 * // ledInfo: { operation: 'LED_ON',
 * //            ledBlinkPeriod: { ledOnPeriod: 110, ledOffPeriod: 100 } }
 *
 * var dictionary2 = { 'title': 'Noti2',
 *                     'content': 'Ongoing content'
 *                   };
 * // Notification 2, On-going type
 * var myNoti2 = new Manager.OnGoingNotification(dictionary2);
 * // myNoti2.setAction(appControl, "app");
 * // default option is to launch the app itself
 * myNoti2.progressPercentage = 0.1;
 * Manager.post(myNoti2);
 *
 * var myNoti_loaded = Manager.getNotification(myNoti2.id)
 * myNoti_loaded.progressPercentage = 0.5;
 * myNoti_loaded.content = 'New OnGoing contents';
 * Manager.update(myNoti_loaded);
 *
 * // Notification 3, Active type
 * var myNoti3 = new Manager.ActiveNotification(dictionary1);
 * myNoti3.title = 'ActiveNoti';
 * myNoti3.content = 'Hello Tizen!'
 * myNoti3.autoRemove = "FALSE";
 * myNoti3.addButton('BUTTON1', 'Call', appControl);
 * myNoti3.addButton('BUTTON2', 'Reply', appControl);
 * myNoti3.addButton('BUTTON3', 'View', appControl);
 * // myNoti3.removeButton('BUTTON1');
 * Manager.post(myNoti3);
 *
 * // Manager.remove(myNoti1);
 * // Manager.removeAll();
 *
 * // Notification 4, toast popup type
 * var message = 'The Status Message Posted';
 * Manager.postStatusMessage(message);
 *
 * ```
 * @module tizen-notification
 * @since 3.0
 */

'use strict';

var async_message_id = 0;
var async_map = new Map();

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log(e.message);
    return {};
  }
}

function native_async_call(method, parameter, cb) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  var asyncid = async_message_id++;
  args['asyncid'] = 'asynid_' + asyncid;
  async_map.set(args['asyncid'], cb);
  extension.postMessage(JSON.stringify(args));
}

function registerEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
        var cb = async_map.get(msg['asyncid']);
        async_map.delete(msg['asyncid']);
        cb(msg);
      } else {
        console.log('cb is not function');
      }
    };
  })(app);
  extension.setMessageListener(handler);
}

/**
* A Manager class is an interface that provides the access to control
* notifications.
*
* @namespace tizen-notification
* @class Manager
* @since 3.0
*/
class Manager {
  constructor() {
    registerEventHandler(this);
  }

/**
* Posts a notification to display.
* The basic, on-going or active types of notifications can be posted.
*
* @method post
* @param {Notification} notification The notification to post
* @since 3.0
*/
  post(notification) {
    console.log('Manager post() method');
    if (!notification) {
      console.log('Invalid parameter, notification is missing');
      return;
    }

    console.log('input notification to post:');
    var util = require('util');
    console.log(util.inspect(notification, {showHidden: false, depth: null}));

    var result = native_sync_call('post', notification);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      notification.id_ = result['id'];
      console.log('The posted notification id : ' + notification.id);
      notification.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('post: OK');
    }
  }

/**
* Updates an on-going notification that is previously posted.
*
* @method update
* @param {OnGoingNotification} notification The on-going type notification to update
* @since 3.0
*/
  update(notification) {
    console.log('Manager update() method');
    if (!notification) {
      console.log('Invalid parameter, notification is missing');
      return;
    }

    var result = native_sync_call('update', notification);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      notification.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('update: OK');
    }
  }

/**
* Removes a previously posted notification.
*
* @method remove
* @param {Notification od ID} notificationOrId A previously posted notification or the notification id to remove
* @since 3.0
*/
  remove(notificationOrId) {
    console.log('Manager remove() method');
    if (!notificationOrId) {
      console.log('Invalid parameter, notificationOrId is missing');
      return;
    }
    var args = {};
    if (notificationOrId instanceof Notification) {
      args['id'] = notificationOrId.id;
    } else {
      args['id'] = notificationOrId;
    }

    var result = native_sync_call('remove', args);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      console.log('remove: OK');
    }
  }

/**
* Removes all notifications that have been posted by the current application.
*
* @method removeAll
* @since 3.0
*/
  removeAll() {
    console.log('Manager removeAll() method');
    var result = native_sync_call('removeAll');
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      console.log('removeAll: OK');
    }
  }

/**
* Gets the package name of the current application.
*
* @method getPkgname
* @param {Number} notification_id A notification id to get the package name
* @return {String} The package name
* @since 3.0
*/
  getPkgname(notification_id) {
    console.log('Manager getPkgname() method');
    var args = {};
    args['id'] = notification_id;
    var result = native_sync_call('getPkgname', args);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      console.log('getPkgname: OK');
      return result['pkgname'];
    }
  }

/**
* Gets a notification that has previously been posted by the current application.
*
* @method getNotification
* @param {Number} notification_id A notification id to get
* @return {Notification} The notification
* @since 3.0
*/
  getNotification(notification_id) {
    console.log('Manager getNotification() method');
    var args = {'id': notification_id};
    console.log('Notification id to get : ' + notification_id);
    var result = native_sync_call('getNotification', args);
    if (result['result'] == 'OK') {
      delete result.result;
      delete result.asyncid;
      var insertedTime = result['insertionTime'];
      delete result.insertionTime;

      var ret;
      if (result['type'] == 'TYPE_ACTIVE') {
        delete result.type;
        ret = new ActiveNotification(result);
      } else if (result['type'] == 'TYPE_ONGOING') {
        delete result.type;
        ret = new OnGoingNotification(result);
      }  else if (result['type'] == 'TYPE_NOTI') {
        delete result.type;
        ret = new Notification(result);
      }
      if (result.hasOwnProperty('operation_')) {
        var AppControl = require('tizen-app-control');
        var appcontrol = new AppControl(result['operation_']);
        delete result.operation_;
        if (result.hasOwnProperty('uri_')) {
          appcontrol.uri = result['uri_'];
          delete result.uri_;
        }
        if (result.hasOwnProperty('mime_')) {
          appcontrol.mime = result['mime_'];
          delete result.mime_;
        }
        if (result.hasOwnProperty('category_')) {
          appcontrol.category = result['category_'];
          delete result.category_;
        }
        ret.setAction(appcontrol);
      }
      ret.insertionTime_ = new Date(insertedTime);
      ret.id_ = notification_id;
      console.log('get: OK');
      return ret;
    } else {
      return undefined;
    }
  }

/**
* Shows a toast popup window with given message.
*
* @method postStatusMessage
* @param {message} message The status message to post
* @since 3.0
*/
  postStatusMessage(message) {
    console.log('Manager postStatusMessage() method');
    var args = {};
    args['message'] = message;
    var result = native_sync_call('postStatusMessage', args);
    if (result['result'] == 'FAIL') {
      console.log(result['reason']);
    }
    if (result['result'] == 'OK') {
      console.log('postStatusMessage: OK');
    }
  }
};

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (let attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
}

/**
* The basic type of a notification that will be displayed on the notification
* area.
* An instance of this class is created by using a constructor with one input
* parameter which is the dictionary of the notification.
*
* @namespace tizen-notification
* @class Notification
* @constructor
* @param {Object} [dictionary] The properties to offers additional arrtibutes to represent a notification.
* @param {String} [dictionary.title] The title text of the notification
* @param {String} [dictionary.content] The content text of the notification
* @param {String} [dictionary.iconPath] The icon path of the notification
* @param {String} [dictionary.iconForIndicatorPath] The indicator icon path of the notification
* @param {String} [dictionary.iconForLockPath] The lock screen icon path of the notification
* @param {String} [dictionary.thumbnailPath] The thumbnail path of the notification
* @param {String} [dictionary.subIconPath] The sub icon path of the notification
* @param {String} [dictionary.backgroundImagePath] The background image path of the notification
* @param {Number} [dictionary.timestamp] The timestamp of the notification in double number
* @param {String} [dictionary.sound] The sound type of the notification
* * 'NONE' - Default value. no sound
* * 'DEFAULT' - Default sound
* * Sound Path - User sound data path
* @param {String} [dictionary.vibration] The vibration type of the notification
* * 'NONE' - Default value. no vibration
* * 'DEFAULT' - Default vibration pattern
* * Vibration Path - User vibration data path
* @param {String} [dictionary.layout] The layout of the notification view
* @since 3.0
*/
class Notification {
  constructor(dictionary) {
    this.type_ = 'TYPE_NOTI';
    this.dictionary_ = clone(dictionary);
    this.id_ = -1;
    this.insertionTime_ = 0;
    console.log('input type : ' + this.type_);
  }

/**
* Sets the launch option for a notification when it is selected.
*
* @method setAction
* @param {appControl} appControl The app control to set
* @param {String} [appId] The appId to launch
* @since 3.0
*/
  setAction(appControl, appId) {
    this.dictionary_.ActionAppControl = appControl;
    if (appId) {
      this.dictionary_.ActionAppId = appId;
    }
  }

/**
* Gets the launch option for a notification when it is selected.
*
* @method getAction
* @return {Object} The action
* * appControl - The appControl
* * appId -  The app id
* @since 3.0
*/
  getAction() {
    var action = {};
    if (this.dictionary_.hasOwnProperty('ActionAppControl')) {
        action['appControl'] = this.dictionary_.ActionAppControl;
    }
    if (this.dictionary_.hasOwnProperty('ActionAppId')) {
        action['appId'] = this.dictionary_.ActionAppId;
    }
    if (appId) {
      this.dictionary_.ActionAppId = appId;
    }
  }

/**
* Sets the led options for a notification.
*
* @method setLed
* @param {String} operation The led option type
* @value LED_OFF Default value. Disable the LED notification
* @value LED_ON Turn on the LED with default color
* @param {Number} [customColor] The custom led color
* @param {Object} [ledBlinkPeriod] The time period of flashing the LED
* * 'ledOnPeriod' - The time for turning on the LED in ms
* * 'ledOffPeriod' - The time for turning off the LED in ms
* @since 3.0
*/
  setLed(operation, customColor, ledBlinkPeriod) {
    //operation: LED_ON, LED_OFF
    this.dictionary_.ledOption = operation;
    if (operation == "LED_ON") {
      if (typeof customColor == 'number') {
        this.dictionary_.ledCustomColor = customColor;
        if (ledBlinkPeriod) {
          this.dictionary_.ledOnPeriod = ledBlinkPeriod.ledOnPeriod;
          this.dictionary_.ledOffPeriod = ledBlinkPeriod.ledOffPeriod;
        }
      } else if (typeof customColor == 'object') {
        this.dictionary_.ledOnPeriod = customColor.ledOnPeriod;
        this.dictionary_.ledOffPeriod = customColor.ledOffPeriod;
      }
    } else {
      delete this.dictionary_.ledcustomColor;
      delete this.dictionary_.ledOnPeriod;
      delete this.dictionary_.ledOffPeriod;
    }
  }

/**
* Gets the led options for a notification.
*
* @method getLed
* @return {Object} The led options
* * 'operation' - LED_ON or LED_OFF
* * 'customColor' - The custom led color
* * 'ledBlinkPeriod' - The time period of flashing the LED in ms (ledOnPeriod, ledOffPeriod)
* @since 3.0
*/
  getLed() {
    var ledInfo = {};
    if (this.dictionary_.hasOwnProperty('ledOption')
        && this.dictionary_.ledOption == 'LED_ON' ) {
      ledInfo['operation'] = this.dictionary_.ledOption;
      if (this.dictionary_.hasOwnProperty('ledCustomColor')) {
        ledInfo['customColor'] = this.dictionary_.ledCustomColor;
      }
      if (this.dictionary_.hasOwnProperty('ledOnPeriod')) {
        var blinkPeriod = {}
        blinkPeriod['ledOnPeriod'] = this.dictionary_.ledOnPeriod;
        blinkPeriod['ledOffPeriod'] = this.dictionary_.ledOffPeriod;
        ledInfo['ledBlinkPeriod'] = blinkPeriod;
      }
    } else {
      return {};
    }
    return ledInfo;
  }

  get type() {
    return this.type_;
  }

  get insertTime() {
    return this.insertionTime_;
  }

  get id() {
    return this.id_;
  }

  get title() {
    return this.dictionary_.title;
  }
  set title(value) {
    this.dictionary_.title = value;
  }

  get content() {
    return this.dictionary_.content;
  }
  set content(value) {
    this.dictionary_.content = value;
  }

  get iconPath() {
    return this.dictionary_.iconPath;
  }
  set iconPath(value) {
    this.dictionary_.iconPath = value;
  }

  get iconForIndicatorPath() {
    return this.dictionary_.iconForIndicatorPath;
  }
  set iconForIndicatorPath(value) {
    this.dictionary_.iconForIndicatorPath = value;
  }

  get iconForLockPath() {
    return this.dictionary_.iconForLockPath;
  }
  set iconForLockPath(value) {
    this.dictionary_.iconForLockPath = value;
  }

  get thumbnailPath() {
    return this.dictionary_.thumbnailPath;
  }
  set thumbnailPath(value) {
    this.dictionary_.iconForLockPath = value;
  }

  get subIconPath() {
    return this.dictionary_.subIconPath;
  }
  set subIconPath(value) {
    this.dictionary_.subIconPath = value;
  }

  get backgroundImagePath() {
    return this.dictionary_.backgroundImagePath;
  }
  set backgroundImagePath(value) {
    this.dictionary_.backgroundImagePath = value;
  }

  get timestamp() {
    return this.dictionary_.timestamp;
  }
  set timestamp(value) {
    this.dictionary_.timestamp = value;
  }

  get sound() {
    return this.dictionary_.sound;
  }
  set sound(value) {
    this.dictionary_.sound = value;
  }

  get vibration() {
    return this.dictionary_.vibration;
  }
  set vibration(value) {
    this.dictionary_.vibration = value;
  }

  get appControl() {
    return this.dictionary_.appControl;
  }
  set appControl(value) {
    this.dictionary_.appControl = value;
  }

  get layout() {
    return this.dictionary_.layout;
  }
  set layout(value) {
    this.dictionary_.layout = value;
  }
};

/**
* The on-going type of a notification that will be displayed on the on-going
* area.
* An instance of this class is created by using a constructor with one input
* parameter which is the dictionary of the notification.
*
* @namespace tizen-notification
* @class OnGoingNotification
* @constructor
* @param {Object} [dictionary] The properties to offers additional arrtibutes to represent a notification.
* @param {String} [dictionary.title] The title text of the notification
* @param {String} [dictionary.content] The content text of the notification
* @param {String} [dictionary.iconPath] The icon path of the notification
* @param {String} [dictionary.iconForIndicatorPath] The indicator icon path of the notification
* @param {String} [dictionary.iconForLockPath] The lock screen icon path of the notification
* @param {String} [dictionary.thumbnailPath] The thumbnail path of the notification
* @param {String} [dictionary.subIconPath] The sub icon path of the notification
* @param {String} [dictionary.backgroundImagePath] The background image path of the notification
* @param {Number} [dictionary.timestamp] The timestamp of the notification in double number
* @param {String} [dictionary.sound] The sound type of the notification
* * 'NONE' - Default value. no sound
* * 'DEFAULT' - Default sound
* * Sound Path - User sound data path
* @param {String} [dictionary.vibration] The vibration type of the notification
* * 'NONE' - Default value. no vibration
* * 'DEFAULT' - Default vibration pattern
* * Vibration Path - User vibration data path
* @param {String} [dictionary.layout] The layout of the notification view
* @since 3.0
*/
class OnGoingNotification extends Notification {
  constructor(dictionary) {
    super(dictionary);
    this.type_ = 'TYPE_ONGOING';
    console.log('Ongoing notification is created');
  }

  get progressSize() {
    return this.dictionary_.progressSize;
  }
  set progressSize(value) {
    this.dictionary_.progressSize = value;
  }

  get progressPercentage() {
    return this.dictionary_.progressPercentage;
  }
  set progressPercentage(value) {
    this.dictionary_.progressPercentage = value;
  }
}

/**
* The active type of a notification that will be displayed on the top of the
* display.
* An instance of this class is created by using a constructor with one input
* parameter which is the dictionary of the notification.
*
* @namespace tizen-notification
* @class ActiveNotification
* @constructor
* @param {Object} [dictionary] The properties to offers additional arrtibutes to represent a notification.
* @param {String} [dictionary.title] The title text of the notification
* @param {String} [dictionary.content] The content text of the notification
* @param {String} [dictionary.iconPath] The icon path of the notification
* @param {String} [dictionary.iconForIndicatorPath] The indicator icon path of the notification
* @param {String} [dictionary.iconForLockPath] The lock screen icon path of the notification
* @param {String} [dictionary.thumbnailPath] The thumbnail path of the notification
* @param {String} [dictionary.subIconPath] The sub icon path of the notification
* @param {String} [dictionary.backgroundImagePath] The background image path of the notification
* @param {Number} [dictionary.timestamp] The timestamp of the notification in double number
* @param {String} [dictionary.sound] The sound type of the notification
* * 'NONE' - Default value. no sound
* * 'DEFAULT' - Default sound
* * Sound Path - User sound data path
* @param {String} [dictionary.vibration] The vibration type of the notification
* * 'NONE' - Default value. no vibration
* * 'DEFAULT' - Default vibration pattern
* * Vibration Path - User vibration data path
* @param {String} [dictionary.autoRemove] The auto remove option of the active notification. The 'auto remove' option let the active notification be removed in several seconds after it shows. Default value is true.
* * 'TRUE' - Default value. Lets the active notification be removed in several seconds after it shows
* * 'FALSE' - The active notification will not be removed as long as the user removes the active notification or the app which posted the active notification removes the active notification.
* @param {String} [dictionary.layout] The layout of the notification view
* @since 3.0
*/
class ActiveNotification extends Notification {
  constructor(dictionary) {
    super(dictionary);
    this.type_ = 'TYPE_ACTIVE';
  }

  get autoRemove() {
    return this.dictionary_.autoRemove;
  }
  set autoRemove(value) {
    this.dictionary_.autoRemove = value;
  }

/**
* Adds the buttons for a notification.
*
* @method addButton
* @param {String} buttonIndex Button index
* @value BUTTON1 button 1
* @value BUTTON2 button 2
* @value BUTTON3 button 3
* @param {String} buttonLabel The button label to show
* @param {appControl} appControl The appControl to set the action
* @param {String} [buttonImagePath] The button image path to set
* @since 3.0
*/
  addButton(buttonIndex, buttonLabel, appControl, buttonImagePath) {
    // buttonIndex: BUTTON1 BUTTON2 BUTTON3
    var args = {};
    if (buttonIndex == "BUTTON1") {
      this.dictionary_.button1 = "ADD";
      this.dictionary_.button1Label = buttonLabel;
      this.dictionary_.button1AppControl = appControl;
      if (buttonImagePath) {
        this.dictionary_.button1ImagePath = buttonImagePath;
      }
    } else if (buttonIndex == "BUTTON2") {
      this.dictionary_.button2 = "ADD";
      this.dictionary_.button2Label = buttonLabel;
      this.dictionary_.button2AppControl = appControl;
      if (buttonImagePath) {
        this.dictionary_.button2ImagePath = buttonImagePath;
      }
    } else if (buttonIndex == "BUTTON3") {
      this.dictionary_.button3 = "ADD";
      this.dictionary_.button3Label = buttonLabel;
      this.dictionary_.button3AppControl = appControl;
      if (buttonImagePath) {
        this.dictionary_.button3ImagePath = buttonImagePath;
      }
    }
  }

/**
* Removes the buttons for a notification.
*
* @method removeButton
* @param {String} buttonIndex Button index
* @value BUTTON1 button 1
* @value BUTTON2 button 2
* @value BUTTON3 button 3
* @since 3.0
*/
  removeButton(buttonIndex) {
    // buttonIndex: BUTTON1 BUTTON2 BUTTON3
    if (buttonIndex == "BUTTON1") {
      this.dictionary_.button1 = "REMOVE";
    } else if (buttonIndex == "BUTTON2") {
      this.dictionary_.button2 = "REMOVE";
    } else if (buttonIndex == "BUTTON3") {
      this.dictionary_.button3 = "REMOVE";
    } else if (buttonIndex == "BUTTON4") {
      this.dictionary_.button4 = "REMOVE";
    } else if (buttonIndex == "BUTTON5") {
      this.dictionary_.button5 = "REMOVE";
    } else if (buttonIndex == "BUTTON6") {
      this.dictionary_.button6 = "REMOVE";
    }
  }

};

exports = new Manager();
exports.Notification = Notification;
exports.OnGoingNotification = OnGoingNotification;
exports.ActiveNotification = ActiveNotification;