'use strict';


var internalKeys = {
  'operation': '__APP_SVC_OP_TYPE__',
  'uri': '__APP_SVC_URI__',
  'mime': '__APP_SVC_MIME_TYPE__',
  'category': '__APP_SVC_CATEGORY__',
};

var internalMap = Symbol();
  /**
   * @class AppControl
   * @constructor
   * @param String operation
   * @param Object config {'uri', 'mime', 'category'}
   */
class AppControl {
  constructor(operation, config) {
    this[internalMap] = new Map();
    this.data = new Map();
    if (config && config['json']) {
      for (let key in config['json']) {
        if (key.startsWith('__')) {
          this[internalMap].set(key, config['json'][key]);
        } else {
          this.data.set(key, config['json'][key]);
        }
      }
    } else {
      this.operation = operation;
      if (config) {
        if (config['uri']) {
          this.uri = config['uri'];
        }
        if (config['mime']) {
          this.mime = config['mime'];
        }
        if (config['category']) {
          this.category = config['category'];
        }
      }
    }
  }

  /**
   * @attribute String operation
   */

  get operation() {
    return this[internalMap].get(internalKeys['operation']);
  }

  set operation(value) {
    this[internalMap].set(internalKeys['operation'], value);
  }

  /**
   * @attribute String uri
   */
  get uri() {
    return this[internalMap].get(internalKeys['uri']);
  }
  set uri(value) {
    this[internalMap].set(internalKeys['uri'], value);
  }

  /**
   * @attribute String mime
   */
  get mime() {
    return this[internalMap].get(internalKeys['mime']);
  }
  set mime(value) {
    this[internalMap].set(internalKeys['mime'], value);
  }

  /**
   * @attribute String category
   */
  get category() {
    return this[internalMap].get(internalKeys['category']);
  }
  set category(value) {
    this[internalMap].set(internalKeys['category'], value);
  }

  /**
   * @method toJSON
   *
   * @return String
   */
  toJSON() {
    var obj = {};
    this[internalMap].forEach(function(v, k) {
      obj[k] = v;
    });
    this['data'].forEach(function(v, k) {
      obj[k] = v;
    });
    return JSON.stringify(obj);
  }
};

/**
 * @method fromJson
 *
 * @param String json
 *
 * @return AppControl
 */
AppControl.fromJSON = function(json) {
  return new AppControl('', {'json': JSON.parse(json)});
};


// Definition for the app_control operation: main operation for an explicit launch.
AppControl.OPERATION_MAIN = 'http://tizen.org/appcontrol/operation/main';

// Definition for the app_control operation: default operation for an explicit launch.
AppControl.OPERATION_DEFAULT = 'http://tizen.org/appcontrol/operation/default';

// Definition for the app_control operation: provides an explicit editable access to the given data.
AppControl.OPERATION_EDIT = 'http://tizen.org/appcontrol/operation/edit';

// Definition for the app_control operation: displays the data.
AppControl.OPERATION_VIEW = 'http://tizen.org/appcontrol/operation/view';

// Definition for the app_control operation: picks an item from the data, returning what is selected.
AppControl.OPERATION_PICK = 'http://tizen.org/appcontrol/operation/pick';

// Definition for the app_control operation: creates content, returning what is created.
AppControl.OPERATION_CREATE_CONTENT = 'http://tizen.org/appcontrol/operation/create_content';

// Definition for the app_control operation: performs a call to someone specified by the data.
AppControl.OPERATION_CALL = 'http://tizen.org/appcontrol/operation/call';

// Definition for the app_control operation: delivers some data to someone else.
AppControl.OPERATION_SEND = 'http://tizen.org/appcontrol/operation/send';

// Definition for the app_control operation: delivers text data to someone else.
AppControl.OPERATION_SEND_TEXT = 'http://tizen.org/appcontrol/operation/send_text';

// Definition for the app_control operation: shares an item with someone else.
AppControl.OPERATION_SHARE = 'http://tizen.org/appcontrol/operation/share';

// Definition for the app_control operation: shares multiple items with someone else.
AppControl.OPERATION_MULTI_SHARE = 'http://tizen.org/appcontrol/operation/multi_share';

// Definition for the app_control operation: shares text data with someone else.
AppControl.OPERATION_SHARE_TEXT = 'http://tizen.org/appcontrol/operation/share_text';


// Definition for the app_control operation: dials a number as specified by the data.
AppControl.OPERATION_DIAL = 'http://tizen.org/appcontrol/operation/dial';

// Definition for the app_control operation: performs a search.
AppControl.OPERATION_SEARCH = 'http://tizen.org/appcontrol/operation/search';

// Definition for the app_control operation: downloads an item.
AppControl.OPERATION_DOWNLOAD = 'http://tizen.org/appcontrol/operation/download';

// Definition for the app_control operation: prints content.
AppControl.OPERATION_PRINT = 'http://tizen.org/appcontrol/operation/print';

// Definition for the app_control operation: composes.
AppControl.OPERATION_COMPOSE = 'http://tizen.org/appcontrol/operation/compose';

// Definition for app_control optional data: the subject of a message.
AppControl.DATA_SUBJECT = 'http://tizen.org/appcontrol/data/subject';

// Definition for app_control optional data: e-mail addresses.
AppControl.DATA_TO = 'http://tizen.org/appcontrol/data/to';

// Definition for app_control optional data: e-mail addresses that should be carbon copied.
AppControl.DATA_CC = 'http://tizen.org/appcontrol/data/cc';

// Definition for app_control optional data: e-mail addresses that should be blind carbon copied.
AppControl.DATA_BCC = 'http://tizen.org/appcontrol/data/bcc';

// Definition for app_control optional data: the content of the data is associated with APP_CONTROL_OPERATION_SEND.
AppControl.DATA_TEXT = 'http://tizen.org/appcontrol/data/text';

// Definition for app_control optional data: the title of the data.
AppControl.DATA_TITLE = 'http://tizen.org/appcontrol/data/title';

// Definition for app_control optional data: the path of a selected item.
AppControl.DATA_SELECTED = 'http://tizen.org/appcontrol/data/selected';

// Definition for app_control optional data: multiple item path to deliver.
AppControl.DATA_PATH = 'http://tizen.org/appcontrol/data/path';

// Definition for app_control optional data: the selection type.
AppControl.DATA_SELECTION_MODE = 'http://tizen.org/appcontrol/data/selection_mode';


/*
 * @module tizen-app-control
 *
 *
 * ```
 * var AppControl = require('tizen-app-control');
 *
 * var appcontrol = new AppControl(AppControl.OPERATION_VIEW);
 *
 * var appcontrol2 = AppControl.fromJson(string);
 *
 * ```
 */
module.exports = AppControl;
