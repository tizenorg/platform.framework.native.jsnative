var reaper = require('reaper');

var MyClass = function(name) {
  this.name = name;
};

var obj = new MyClass('john');

reaper.setReaper(obj, function(deleted_object) {
    console.log(deleted_object.name + ' was dead');
  });

obj = undefined;
for (var i = 0; i < 10000; i++) {
  var buff = new ArrayBuffer(100 * 300);
}
