(function() {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var Q = require('q');

  var help = require('./help');

  module.exports = cli;

  /**
    * This program uses 'Promises'.
    * Reference below links for detailed contents.
    * Promises: http://www.html5rocks.com/en/tutorials/es6/promises/
    * q: https://github.com/kriskowal/q
    */
  function cli(inputArgv, execPath) {
    // verify inputArgv
    var argv = getVerifiedArgv(inputArgv);
    if (argv === null) {
      help.printAll();
      return;
    }

    argv.exec_path_ = execPath;

    // setup manifest parser
    var parser = new (require('./parser'))(execPath);

    // process command
    switch (argv.cmd_) {
      case 'create':
      return require('./create')(argv, parser)
      .then(
        function() { 
          console.log('Ok');
        },
        function(err) {
          console.error(err.message);
          help.printCreate();
        });

      case 'list':
      return require('./list')(argv, parser)
      .then(
        function() {
          console.log('Ok');
        },
        function(err) {
          console.error(err.message);
          help.printList();
        });

      case 'remove':
      return require('./remove')(argv, parser)
      .then(
        function() {
          console.log('Ok');
        },
        function(err) {
          console.error(err.message);
          help.printRemove();
        });

      case 'sign':
      return require('./sign')(argv, parser)
      .then(
        function() {
          console.log('Ok');
        },
        function(err) {
          console.error(err.message);
          help.printSign();
        });

      case 'build':
      return require('./build')(argv, parser)
      .then(
        function() {
          console.log('Ok');
        },
        function(err) {
          console.error(err.message);
          help.printBuild();
        });

      case 'help':
      default:
      help.print(argv.args_[0]);
      break;
    }

    function getVerifiedArgv(inputArgv) {
      if (inputArgv.length < 3)
        return null;

      var cmd = inputArgv[2];
      var args = [];
      switch (cmd) {
        case 'create':
        args.push(inputArgv[3]);
        args.push(inputArgv[4]);
        break;

        case 'remove':
        args.push(inputArgv[3]);
        break;

        case 'sign':
        case 'build':
        var len = inputArgv.length;
        for (var i = 3; i < len; i+=1)
          args[i-3] = inputArgv[i];
        break;

        case 'list':
        break;

        case 'help':
        args.push(inputArgv[3]);
        break;

        default:
        return null;
      }

      return {
        cmd_: cmd,
        args_: args
      };
    }
  }
}());