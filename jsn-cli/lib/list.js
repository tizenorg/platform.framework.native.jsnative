(function() {
  'use strict';

  var path = require('path');
  var Q = require('q');

  var JsnError = require('./jsn_error');
  module.exports = function(argv, parser) {
    return parser.parse()
    .catch(function(err) {
        throw new JsnError('Parsing manifest file has a problem: ' +
                           err.message);
      })
    .then(function() {
      console.log('Listing apps');
      if (parser.get('parsed') && parser.get('has_app')) {
        console.log('No.\tAppId\tAppType\tExec');
        var len = parser.get('apps').length;
        for (var i = 0; i < len; i++) {
          var app = parser.get('apps')[i];
          console.log((i+1) + '\t' + app.app_id + '\t' + app.type +
                      '\t' + app.exec);
        }
      } else {
        console.log('There is no app');
      }
    });
  };
}());