"use strict";

var my_secret_key = Symbol();
var my_secret_function = Symbol();

class Secret {
  constructor() {
    this[my_secret_key] = Math.random()*100;
    this[my_secret_function] = function(args) {
      console.log('orignal data is = '+ args);
    }
  }

  GetUserSecretKey(data) {
    this[my_secret_function](data);
    var crypto = require('crypto');
    var sha1 = crypto.createHash('sha1').update(data + this[my_secret_key]);
    return sha1.digest("hex");
  }

}

module.exports = Secret;

if (require.main === module) {
  var obj = new Secret();
  console.log(obj.GetUserSecretKey('hello'));
}
