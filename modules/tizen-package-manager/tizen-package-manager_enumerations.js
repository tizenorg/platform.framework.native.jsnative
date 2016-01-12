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
 * Enumeration for certification type.
 * @element CertType
 * @attribute AUTHOR-ROOT Author Root Certificate
 * @attribute AUTHOR-INTERMEDIATE Author Intermediate Certificate
 * @attribute AUTHOR-SIGNER Author Signer Certificate
 * @attribute DISTRIBUTOR-ROOT Distributor Root Certificate
 * @attribute DISTRIBUTOR-INTERMEDIATE Distributor Intermediate Certificate
 * @attribute DISTRIBUTOR-SIGNER Distributor Signer Certificate
 * @attribute DISTRIBUTOR2-ROOT Distributor2 Root Certificate
 * @attribute DISTRIBUTOR2-INTERMEDIATE Distributor2 Intermediate Certificate
 * @attribute DISTRIBUTOR2-SIGNER Distributor2 Signer Certificate
 **/
var CertType = {
  'AUTHOR-ROOT': 'author-root',
  'AUTHOR-INTERMEDIATE': 'author-intermediate',
  'AUTHOR-SIGNER': 'author-signer',
  'DISTRIBUTOR-ROOT': 'distributor-root',
  'DISTRIBUTOR-INTERMEDIATE': 'distributor-intermediate',
  'DISTRIBUTOR-SIGNER': 'distributor-signer',
  'DISTRIBUTOR2-ROOT': 'distributor2-root',
  'DISTRIBUTOR2-INTERMEDIATE': 'distributor2-intermediate',
  'DISTRIBUTOR2-SIGNER': 'distributor2-signer'
};

/**
 * Enumeration for app component type.
 * @element AppComponentType
 * @attribute ALLAPP All application
 * @attribute UIAPP UI application
 * @attribute SERVICEAPP Service application
 **/
var AppComponentType = {
  'ALLAPP': 'all-app',
  'UIAPP': 'ui-app',
  'SERVICEAPP': 'service-app'
};

/**
 * Enumeration for storage type.
 * @element InstalledStorageType
 * @attribute INTERNAL-STORAGE Internal storage
 * @attribute EXTERNAL-STORAGE External storage
 **/
var InstalledStorageType = {
  'INTERNAL-STORAGE': 'internal-storage',
  'EXTERNAL-STORAGE': 'external-storage'
};

/**
 * Enumeration for certification compare type.
 * @element CompareResultType
 * @attribute COMPARE-MATCH Matching certification
 * @attribute COMPARE-MISMATCH Mismatching certification
 * @attribute LHS-NO-CERT First package has no certification
 * @attribute COMPARE-RHS-NO-CERT Second package has no certification
 * @attribute COMPARE-BOTH-NO-CERT Both have no certification
 **/
var CompareResultType = {
  'COMPARE-MATCH': 'compare-match',
  'COMPARE-MISMATCH': 'compare-mismatch',
  'LHS-NO-CERT': 'lhs-no-cert',
  'COMPARE-RHS-NO-CERT': 'compare-rhs-no-cert',
  'COMPARE-BOTH-NO-CERT': 'compare-both-no-cert'
};

/**
 * Enumeration for event state.
 * @element EventState
 * @attribute STARTED Started event state
 * @attribute PROCESSING Processing event state
 * @attribute COMPLETED Completed event state
 * @attribute FAILED Failed event state
 **/
var EventState = {
  'STARTED': 'started',
  'PROCESSING': 'processing',
  'COMPLETED ': 'completed',
  'FAILED': 'failed'
};

/**
 * Enumeration for event type.
 * @element EventType
 * @attribute INSTALL Install event type
 * @attribute UNINSTALL Uninstall event type
 * @attribute UPDATE Update event type
 **/
var EventType = {
  'INSTALL': 'install',
  'UNINSTALL': 'unistall',
  'UPDATE': 'update'
};

/**
 * Enumeration for move type.
 * @element MoveType
 * @attribute INTERNAL Internal type
 * @attribute EXTERNAL External type
 **/
var MoveType = {
  'INTERNAL': 'internal',
  'EXTERNAL': 'external'
};

/**
 * Enumeration for permission type.
 * @element PermissionType
 * @attribute NORMAL Normal permission
 * @attribute SIGNATURE Signature permission
 * @attribute PRIVILEGE Privilege permission
 **/
var PermissionType = {
  'NORMAL': 'normal',
  'SIGNATURE': 'signature',
  'PRIVILEGE': 'privilege'
};

/**
 * Enumeration for status type.
 * @element StatusType
 * @attribute ALL All status
 * @attribute INSTALL Install package status
 * @attribute UNINSTALL Uninstall package status
 * @attribute UPGRADE Upgrade package status
 * @attribute MOVE Move package status
 * @attribute CLEAR-DATA Clear data status
 * @attribute INSTALL-PROGRESS Install progress status
 * @attribute GET-SIZE Get size status
 **/
var StatusType = {
  'ALL': 'all',
  'INSTALL': 'install',
  'UNINSTALL': 'uninstall',
  'UPGRADE': 'upgrade',
  'MOVE': 'move',
  'CLEAR-DATA': 'clear-data',
  'INSTALL-PROGRESS': 'install-progress',
  'GET-SIZE': 'get-size'
};

/**
 * Enumeration for request mode.
 * @element RequestMode
 * @attribute DEFAULT This is not for use by third-party applications. Default request mode
 * @attribute QUIET This is not for use by third-party applications. Quiet request mode
 **/
var RequestMode = {
  'DEFAULT': 'default',
  'QUIET': 'quiet'
};