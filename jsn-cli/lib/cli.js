'use strict'

const fs = require('fs');
const path = require('path');
const Q = require('q');

const help = require('./help');

module.exports = cli;

/**
  * This program uses 'Promises'.
  * Reference below links for detailed contents.
  * Promises: http://www.html5rocks.com/en/tutorials/es6/promises/
  * q: https://github.com/kriskowal/q
  */
function cli(inputArgv, execPath) {
  // verify inputArgv
  const argv = getVerifiedArgv(inputArgv);
  if (argv === null) {
    help.printAll();
    return;
  }

  argv.exec_path_ = execPath;

  // setup manifest parser
  const parser = new (require('./parser'))(execPath);

  // process command
  switch (argv.cmd_) {
    case 'create':
    return require('./create')(argv, parser)
    .then(
      () => console.log('Ok'),
      (err) => {
        console.error(err.message);
        help.printCreate();
      });

    case 'list':
    return require('./list')(argv, parser)
    .then(
      () => console.log('Ok'),
      (err) => {
        console.error(err.message);
        help.printList();
      });

    case 'remove':
    return require('./remove')(argv, parser)
    .then(
      () => console.log('Ok'),
      (err) => {
        console.error(err.message);
        help.printRemove();
      });

    case 'sign':
    return require('./sign')(argv, parser)
    .then(
      () => console.log('Ok'),
      (err) => {
        console.error(err.message);
        help.printSign();
      });

    case 'build':
    return require('./build')(argv, parser)
    .then(
      () => console.log('Ok'),
      (err) => {
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

    const cmd = inputArgv[2];
    const args = [];
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
      const len = inputArgv.length;
      for (let i = 3; i < len; i+=1)
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
