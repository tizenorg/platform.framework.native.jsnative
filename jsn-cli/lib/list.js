'use strict'

const path = require('path')
const Q = require('q');

const JsnError = require('./jsn_error');
module.exports = function(argv, parser) {
  return parser.parse()
  .catch(err => {
      throw new JsnError('Parsing manifest file has a problem: ' +
                         err.message);
    })
  .then(() => {
    console.log('Listing apps');
    if (parser.get('parsed') && parser.get('has_app')) {
      console.log('No.\tAppId\tAppType\tExec');
      const len = parser.get('apps').length;
      for (let i = 0; i < len; i++) {
        const app = parser.get('apps')[i];
        console.log((i+1) + '\t' + app.app_id + '\t' + app.type +
                    '\t' + app.exec);
      }
    } else {
      console.log('There is no app');
    }
  });
};
