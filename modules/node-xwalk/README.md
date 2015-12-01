## node-xwalk
Crosswalk Extension Loader for Node.js allows you to use crosswalk extensions in Node.js environment.

* [Crosswalk Extension](https://github.com/crosswalk-project/crosswalk-website/wiki/Crosswalk-Extensions)

  Crosswalk Extensions allow exposing new functionality to JavaScript environment of your application. 
  This functionality can be implemented in native code.
  * [Writing a Crosswalk Extension](https://github.com/crosswalk-project/crosswalk-website/wiki/Writing-a-Crosswalk-Extension)
  * [Writing a GLib based Crosswalk Extension](https://github.com/crosswalk-project/crosswalk-website/wiki/Writing-a-glib-based-Crosswalk-Extension)

Supported platforms: **Linux** | Other platforms will be supported soon.

**Echo Sample**
```javascript
var xwalk = require('node-xwalk');
var echo = xwalk.require('echo');
echo.echo("Hello Async!!", function(msg) {
  console.log(msg);
});
console.log(echo.syncEcho("Hello Sync!!"));
```
**Output**
```
Instance 1 created!
Hello Async!!
Hello Sync!!
```

## Getting started
From your project directory, run
```
$ npm install https://github.com/WonyoungChoi/node-xwalk
```
This will download and build node-xwalk in ```./node_modules/```. 
Then copy the example files from [examples/](https://github.com/WonyoungChoi/node-xwalk/tree/master/examples) directory in this project.

Build and test a crosswalk extension *'echo example'* with Makefile.
```
$ make
$ node echo.js
```

## License

**node-xwalk** is available under the BSD licenses, see our `LICENSE` file.

