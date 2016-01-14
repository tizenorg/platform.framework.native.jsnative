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
 * The Tizen Notification Module.
 *
 * 'tizen-notification' module exports not only an instance of Manager class
 * but also a Notification, OnGoingNotification and ActiveNotification class.
 * <br/>
 * Therefore, when developers load this module, they can both manage the
 * notifications by using the instance of the Manager class and generate new
 * notifications like below
 *```
 * var manager = require('tizen-notification');
 * var simpleNoti = new manager.Notification(dictionary);
 * var onGoingNoti = new manager.OnGoingNotification(dictionary);
 * var activeNoti = new manager.ActiveNotification(dictionary);
 *```
 *
 * See the [Manager](../classes/Notification.Manager.html),
 *  [Notification](../classes/Notification.Notification.html),
 *  [OnGoingNotification](../classes/Notification.OnGoingNotification.html),
 *  and [ActiveNotification](../classes/Notification.ActiveNotification.html)
 * class descriptions.
 *
 * The Notification module can be used as below.
 * ```
 * var AppControl = require('tizen-app-control');
 * var appControl = new AppControl(AppControl.OPERATION_DEFAULT);
 *
 * var manager = require('tizen-notification');
 * var dictionary1 = { 'title': 'Noti1',
 *                     'content': 'Noti1 content',
 *                     'sound': 'default',
 *                     'vibration': 'default',
 *                   };
 *
 * // Notification 1
 * var myNoti1 = new manager.Notification(dictionary1);
 * var settings = {'onPeriod': 110, 'offPeriod': 100};
 * myNoti1.setLed('on', settings);
 * myNoti1.setAction(appControl, 'org.tizen.message');
 * manager.post(myNoti1);
 * console.log('The pkgname of myNoti1 is : ' + manager.getPkgName(myNoti1.id));
 * console.log('Insertion time of myNoti1: ' + myNoti1.insertTime);
 *   // Insertion time of myNoti1: Thu Jan 08 2015 08:50:32 GMT+0900 (KST)
 * var ledInfo = myNoti1.getLed();
 * // ledInfo: { operation: 'on',
 * //            onPeriod: 110, offPeriod: 100 } }
 *
 * var dictionary2 = { 'title': 'Noti2',
 *                     'content': 'Ongoing content'
 *                   };
 * // Notification 2, On-going type
 * var myNoti2 = new manager.OnGoingNotification(dictionary2);
 * // myNoti2.setAction(appControl, 'app_id');
 * // default option is to launch the app itself
 * myNoti2.progressPercentage = 0.1;
 * manager.post(myNoti2);
 *
 * var myNoti_loaded = manager.getNotification(myNoti2.id)
 * myNoti_loaded.progressPercentage = 0.5;
 * myNoti_loaded.content = 'New OnGoing contents';
 * manager.update(myNoti_loaded);
 *
 * // Notification 3, Active type
 * var myNoti3 = new manager.ActiveNotification(dictionary1);
 * myNoti3.title = 'ActiveNoti';
 * myNoti3.content = 'Hello Tizen!'
 * myNoti3.autoRemove = 'false';
 * myNoti3.addButton('button1', 'Call', appControl);
 * myNoti3.addButton('button2', 'Reply', appControl);
 * myNoti3.addButton('button3', 'View', appControl);
 * // myNoti3.removeButton('button3');
 * manager.post(myNoti3);
 *
 * // manager.remove(myNoti1);
 * // manager.removeAll();
 *
 * // Notification 4, toast popup type
 * var message = 'The Status Message Posted';
 * manager.postStatusMessage(message);
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

/**
* A Manager class is an interface that provides the access to control
* notifications.
* This class is accessed by loading the tizen-notification module.
* ```
* var manager = require('tizen-notification');
*
* ```
*
* @namespace Notification
* @class Manager
* @since 3.0
*/
class Manager {
/**
* Removes a previously posted notification.
*
* @method remove
* @param {Notification.Notification|Number} notificationOrId A previously
* posted notification or the notification id to remove
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
    if (result['result'] === 'FAIL') {
      console.error(result['reason']);
    }
    if (result['result'] === 'OK') {
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
    if (result['result'] === 'FAIL') {
      console.error(result['reason']);
    }
    if (result['result'] === 'OK') {
      console.log('removeAll: OK');
    }
  }

/**
* Gets the package name of the current application.
*
* @method getPkgName
* @param {Number} notificationId A notification id to get the package name
* @return {String} The package name
* @since 3.0
*/
  getPkgName(notificationId) {
    console.log('Manager getPkgName() method');
    var args = {};
    args['id'] = notificationId;
    var result = native_sync_call('getPkgName', args);
    if (result['result'] === 'FAIL') {
      console.error(result['reason']);
    }
    if (result['result'] === 'OK') {
      console.log('getPkgName: OK');
      return result['pkgname'];
    }
  }

/**
* Gets a notification that has previously been posted by the current
* application.
*
* @method getNotification
* @param {Number} notificationId A notification id to get
* @return {Notification.Notification}
*  The notification
* @since 3.0
*/
  getNotification(notificationId) {
    console.log('Manager getNotification() method');
    var args = {'id': notificationId};
    console.log('Notification id to get : ' + notificationId);
    var result = native_sync_call('getNotification', args);
    if (result['result'] === 'OK') {
      delete result.result;
      delete result.asyncid;
      var insertedTime = result['insertionTime'];
      delete result.insertionTime;

      var ret;
      if (result['type'] === 'type-active') {
        delete result.type;
        ret = new ActiveNotification(result);
      } else if (result['type'] === 'type-ongoing') {
        delete result.type;
        ret = new OnGoingNotification(result);
      }  else if (result['type'] === 'type-noti') {
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
      } else {
        ret.removeAction();
      }
      ret.insertionTime_ = new Date(insertedTime);
      ret.id_ = notificationId;
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
* @param {String} message The status message to post
* @since 3.0
*/
  postStatusMessage(message) {
    console.log('Manager postStatusMessage() method');
    var args = {};
    args['message'] = message;
    var result = native_sync_call('postStatusMessage', args);
    if (result['result'] === 'FAIL') {
      console.error(result['reason']);
    }
    if (result['result'] === 'OK') {
      console.log('postStatusMessage: OK');
    }
  }
};

function clone(obj) {
  if (null === obj || 'object' !== typeof obj) return obj;
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
*
* This class is accessed by loading the tizen-notification module, and the
* developers need to generate the new instance to make a new notification like
* below
*```
* var manager = require('tizen-notification');
* var simpleNoti = new manager.Notification(dictionary);
*```
* An instance of this class is created by using a constructor with one input
* parameter which is the dictionary of the notification.
*
* @namespace Notification
* @class Notification
* @constructor
* @param {Object} [dictionary] The Notification properties to offers additional
* arrtibutes to represent a notification.
* @param {String} [dictionary.title] The title text of the notification
* @param {String} [dictionary.content] The content text of the notification
* @param {String} [dictionary.iconPath] The icon path of the notification
* @param {String} [dictionary.iconForIndicatorPath] The indicator icon path of
* the notification
* @param {String} [dictionary.iconForLockPath] The lock screen icon path of the
* notification
* @param {String} [dictionary.thumbnailPath] The thumbnail path of the
* notification
* @param {String} [dictionary.subIconPath] The sub icon path of the notification
* @param {Number} [dictionary.timestamp] The timestamp of the notification in
* double number
* @param {String} [dictionary.sound] The sound type of the notification
* * 'none' - Default value. no sound
* * 'default' - Default sound
* * Sound Path - User sound data path
* @param {String} [dictionary.vibration] The vibration type of the notification
* * 'none' - Default value. no vibration
* * 'default' - Default vibration pattern
* * Vibration Path - User vibration data path
* @param {String} [dictionary.layout] The layout of the notification view
* * 'none' - Default
* * 'event-single' - Used to inform single event
* * 'event-multiple' - Used to inform multiple event
* * 'thumbnail' - Used to display images
* * 'ongoing-event' - Used to display text message
* * 'ongoing-progress' - Used to display progress
* @since 3.0
*/
class Notification {
  constructor(dictionary) {
    this.type_ = 'type-noti';
    this.dictionary_ = clone(dictionary);
    this.id_ = -1;
    this.insertionTime_ = 0;
    console.log('input type : ' + this.type_);
  }

/**
* Posts a notification to display. <br/>
* The basic, on-going or active types of notifications can be posted.
*
* @method post
* notification The notification to post
* @since 3.0
*/
  post() {
    console.log('Notification post() method');

    console.log('notification to post:');
    var util = require('util');
    console.log(util.inspect(this, {showHidden: false, depth: null}));

    var result = native_sync_call('post', this);
    if (result['result'] === 'FAIL') {
      console.error(result['reason']);
    }
    if (result['result'] === 'OK') {
      this.id_ = result['id'];
      console.log('The posted notification id : ' + this.id_);
      this.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('post: OK');
    }
  }

/**
* Sets the launch option for a notification when it is selected. <br/>
* The default option for the notification is to launch the app itself
* when it is selected.
*
* @method setAction
* @param {appControl} appControl The app control to set. This is an
* [AppControl](../classes/AppControl.html) type.
* @param {String} [appId] The appId to launch. This is String type.
* @since 3.0
*/
  setAction(appControl, appId) {
    if (appControl) {
      this.dictionary_.ActionAppControl = appControl;
      if (appId) {
        this.dictionary_.ActionAppId = appId;
      }
    }
  }

/**
* Removes the launch option for a notification when it is selected.
*
* @method removeAction
* @since 3.0
*/
  removeAction() {
    this.dictionary_.ActionAppControl = 'none';
    delete this.dictionary_.ActionAppId;
  }

/**
* Gets the launch option for a notification when it is selected. <br/>
* @method getAction
* @return {Object} The action
* * appControl - The appControl which is an
* [AppControl](../classes/AppControl.html) type.
* * appId -  The app id in String type. It is optional.
*```
* action = { appControl: appControl,
*            appId: 'appId'}
*
*```
* @since 3.0
*/
  getAction() {
    var action = {};
    if (this.dictionary_.hasOwnProperty('ActionAppControl')) {
      action['appControl'] = this.dictionary_.ActionAppControl;
      if (this.dictionary_.hasOwnProperty('ActionAppId')) {
        action['appId'] = this.dictionary_.ActionAppId;
      }
      return action;
    } else {
      return {};
    }
  }

/**
* Sets the led options for a notification.
*
* @method setLed
* @param {String} operation The led option type
* @value off Default value. Disable the LED notification
* @value on Turn on the LED with default color
* @param {Object} [settings] The time period of flashing the LED
* @param {Number} [settings.customColor] The custom led color in numerical RGB
*  value
* @param {Number} [settings.onPeriod] The time for turning on the LED in ms
* @param {Number} [settings.offPeriod] The time for turning off the LED in ms
* @since 3.0
*/
  setLed(operation, settings) {
    //operation: on, off
    this.dictionary_.ledOption = operation;
    if (operation === 'on') {
      if(settings) {
        if (settings.customColor) {
          this.dictionary_.ledCustomColor = customColor;
        }
        if (settings.onPeriod && settings.offPeriod) {
          this.dictionary_.ledOnPeriod = settings.onPeriod;
          this.dictionary_.ledOffPeriod = settings.offPeriod;
        }
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
* * 'operation' - 'on' or 'off' in String type.
* * 'customColor' - The custom RGB led color in Number type. This is optional.
* * 'onPeriod' - The time period of flashing the LED in ms. onPeriod is the
* time for turning on the LED. This must be used with offPeriod and it is
* optional.
* * 'offPeriod' - The time period of flashing the LED in ms. offPeriod is the
* time for turning off the LED. This must be used with onPeriod and it is
* optional.
*```
* led = { operation: 'on',
*         onPeriod: 100, offPeriod: 100 } }
*```
* @since 3.0
*/
  getLed() {
    var ledInfo = {};
    if (this.dictionary_.hasOwnProperty('ledOption')
        && this.dictionary_.ledOption === 'on' ) {
      ledInfo['operation'] = this.dictionary_.ledOption;
      if (this.dictionary_.hasOwnProperty('ledCustomColor')) {
        ledInfo['customColor'] = this.dictionary_.ledCustomColor;
      }
      if (this.dictionary_.hasOwnProperty('ledOnPeriod')) {
        ledInfo['onPeriod'] = this.dictionary_.ledOnPeriod;
        ledInfo['offPeriod'] = this.dictionary_.ledOffPeriod;
      }
    } else {
      return {};
    }
    return ledInfo;
  }

/**
* The layout of the notification view
* * 'type-noti' - A basic notification type that is removed automatically when
 * selected by the user. All TY_NOTI type notifications can be removed by user
 * interaction.
* * 'type-ongoing' - A notification that informs the user whether an application
* is running or not. It can displays information on the progress of a job.
* However, this notification should be removed by the application that posted
* the notification.
* * 'type-active' - a notification that is showed on the upper side of the
* screen. Buttons can be added for user interaction.
* @attribute type
* @type {String}
* @readonly
* @since 3.0
*/
  get type() {
    return this.type_;
  }

/**
* An insertion timestamp of the notification
* @attribute insertTime
* @type {String}
* @readonly
* @since 3.0
*/
  get insertTime() {
    return this.insertionTime_;
  }

/**
* An id of the notification that is posted.
* The default value is -1 and it is generated when the notification is posted.
* @attribute id
* @type {Number}
* @readonly
* @since 3.0
*/
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
*
* This class extends the
* [Notification](../classes/Notification.Notification.html) class. <br/>
* This class is accessed by loading the tizen-notification module, and the
* developers need to generate the new instance to make a new notification like
* below
*```
* var manager = require('tizen-notification');
* var onGoingNoti = new manager.OnGoingNotification(dictionary);
*```
* An instance of this class is created by using a constructor with one input
* parameter which is the dictionary of the notification.
*
* @namespace Notification
* @class OnGoingNotification
* @extends Notification.Notification
* @constructor
* @param {Object} [dictionary] The Notification properties to offers additional
* arrtibutes to represent a notification.
* @param {String} [dictionary.title] The title text of the notification
* @param {String} [dictionary.content] The content text of the notification
* @param {String} [dictionary.iconPath] The icon path of the notification
* @param {String} [dictionary.iconForIndicatorPath] The indicator icon path of
* the notification
* @param {String} [dictionary.iconForLockPath] The lock screen icon path of the
* notification
* @param {String} [dictionary.thumbnailPath] The thumbnail path of the
* notification
* @param {String} [dictionary.subIconPath] The sub icon path of the notification
* @param {Number} [dictionary.timestamp] The timestamp of the notification in
* double number
* @param {String} [dictionary.sound] The sound type of the notification
* * 'none' - Default value. no sound
* * 'default' - Default sound
* * Sound Path - User sound data path
* @param {String} [dictionary.vibration] The vibration type of the notification
* * 'none' - Default value. no vibration
* * 'default' - Default vibration pattern
* * Vibration Path - User vibration data path
* @param {String} [dictionary.layout] The layout of the notification view
* * 'none' - Default
* * 'event-single' - Used to inform single event
* * 'event-multiple' - Used to inform multiple event
* * 'thumbnail' - Used to display images
* * 'ongoing-event' - Used to display text message
* * 'ongoing-progress' - Used to display progress
* @since 3.0
*/
class OnGoingNotification extends Notification {
  constructor(dictionary) {
    super(dictionary);
    this.type_ = 'type-ongoing';
    console.log('Ongoing notification is created');
  }

/**
* Updates an on-going notification that is previously posted.
*
* @method update
* notification to update
* @since 3.0
*/
  update() {
    console.log('OnGoingNotification update() method');

    var result = native_sync_call('update', this);
    if (result['result'] === 'FAIL') {
      console.error(result['reason']);
    }
    if (result['result'] === 'OK') {
      this.insertionTime_ = new Date(result['insertionTime']) || new Date();
      console.log('update: OK');
    }
  }

/**
* The progress size for the ongoing type
* @attribute progressSize
* @type {Number}
* @since 3.0
*/
  get progressSize() {
    return this.dictionary_.progressSize;
  }
  set progressSize(value) {
    this.dictionary_.progressSize = value;
  }

/**
* The progress percentage for the ongoing type
* The range is from 0.0 to 100.0
* @attribute progressPercentage
* @type {Number}
* @since 3.0
*/
  get progressPercentage() {
    return this.dictionary_.progressPercentage;
  }
  set progressPercentage(value) {
    this.dictionary_.progressPercentage = value;
  }
};

/**
* The active type of a notification that will be displayed on the top of the
* display.
*
* This class extends the
* [Notification](../classes/Notification.Notification.html) class. <br/>
* This class is accessed by loading the tizen-notification module, and the
* developers need to generate the new instance to make a new notification like
* below
*```
* var manager = require('tizen-notification');
* var onGoingNoti = new manager.OnGoingNotification(dictionary);
*```
* An instance of this class is created by using a constructor with one input
* parameter which is the dictionary of the notification.
* ```
* var manager = require('tizen-notification');
* var activeNoti = new manager.ActiveNotification(dictionary);
*
* ```
* @namespace Notification
* @class ActiveNotification
* @extends Notification.Notification
* @constructor
* @param {Object} [dictionary] The Notification properties to offers additional
* arrtibutes to represent a notification.
* @param {String} [dictionary.title] The title text of the notification
* @param {String} [dictionary.content] The content text of the notification
* @param {String} [dictionary.iconPath] The icon path of the notification
* @param {String} [dictionary.iconForIndicatorPath] The indicator icon path of
* the notification
* @param {String} [dictionary.iconForLockPath] The lock screen icon path of the
* notification
* @param {String} [dictionary.thumbnailPath] The thumbnail path of the
* notification
* @param {String} [dictionary.subIconPath] The sub icon path of the notification
* @param {String} [dictionary.backgroundImagePath] The background image path of
* the notification
* @param {Number} [dictionary.timestamp] The timestamp of the notification in
* double number
* @param {String} [dictionary.sound] The sound type of the notification
* * 'none' - Default value. no sound
* * 'default' - Default sound
* * Sound Path - User sound data path
* @param {String} [dictionary.vibration] The vibration type of the notification
* * 'none' - Default value. no vibration
* * 'default' - Default vibration pattern
* * Vibration Path - User vibration data path
* @param {String} [dictionary.autoRemove] The auto remove option of the active
* notification. The 'auto remove' option let the active notification be removed
* in several seconds after it shows. Default value is true.
* * 'true' - Default value. Lets the active notification be removed in several
* seconds after it shows
* * 'false' - The active notification will not be removed as long as the user
* removes the active notification or the app which posted the active
* notification removes the active notification.
* @param {String} [dictionary.layout] The layout of the notification view
* * 'none' - Default
* * 'event-single' - Used to inform single event
* * 'event-multiple' - Used to inform multiple event
* * 'thumbnail' - Used to display images
* * 'ongoing-event' - Used to display text message
* * 'ongoing-progress' - Used to display progress
* @since 3.0
*/
class ActiveNotification extends Notification {
  constructor(dictionary) {
    super(dictionary);
    this.type_ = 'type-active';
  }

/**
* The auto remove option of the active notification.
* The 'auto remove' option let the active notification be removed in several
* seconds after it shows.
* Default value is TRUE.
* * 'true'
* * 'false'
* @attribute autoRemove
* @type {String}
* @since 3.0
*/
  get autoRemove() {
    return this.dictionary_.autoRemove;
  }
  set autoRemove(value) {
    this.dictionary_.autoRemove = value;
  }

/**
* The background image path of the notification
* @attribute backgroundImagePath
* @type {String}
* @since 3.0
*/
  get backgroundImagePath() {
    return this.dictionary_.backgroundImagePath;
  }
  set backgroundImagePath(value) {
    this.dictionary_.backgroundImagePath = value;
  }

/**
* Adds the buttons for a notification.
*
* @method addButton
* @param {String} buttonIndex Button index
* @value button1 button 1
* @value button2 button 2
* @value button3 button 3
* @param {String} buttonLabel The button label to show
* @param {appControl} appControl The appControl to set the action
* @param {String} [buttonImagePath] The button image path to set
* @since 3.0
*/
  addButton(buttonIndex, buttonLabel, appControl, buttonImagePath) {
    // buttonIndex: button1 button2 button3
    if (buttonIndex === 'button1') {
      this.dictionary_.button1 = 'ADD';
      this.dictionary_.button1Label = buttonLabel;
      this.dictionary_.button1AppControl = appControl;
      if (buttonImagePath) {
        this.dictionary_.button1ImagePath = buttonImagePath;
      }
    } else if (buttonIndex === 'button2') {
      this.dictionary_.button2 = 'ADD';
      this.dictionary_.button2Label = buttonLabel;
      this.dictionary_.button2AppControl = appControl;
      if (buttonImagePath) {
        this.dictionary_.button2ImagePath = buttonImagePath;
      }
    } else if (buttonIndex === 'button3') {
      this.dictionary_.button3 = 'ADD';
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
* @value button1 button 1
* @value button2 button 2
* @value button3 button 3
* @since 3.0
*/
  removeButton(buttonIndex) {
    // buttonIndex: button1 button2 button3
    if (buttonIndex === 'button1') {
      delete this.dictionary_.button1;
      delete this.dictionary_.button1Label;
      delete this.dictionary_.button1AppControl;
    } else if (buttonIndex === 'button2') {
      delete this.dictionary_.button2;
      delete this.dictionary_.button2Label;
      delete this.dictionary_.button2AppControl;
    } else if (buttonIndex === 'button3') {
      delete this.dictionary_.button3;
      delete this.dictionary_.button3Label;
      delete this.dictionary_.button3AppControl;
    }
  }

};

exports = new Manager();
exports.Notification = Notification;
exports.OnGoingNotification = OnGoingNotification;
exports.ActiveNotification = ActiveNotification;

