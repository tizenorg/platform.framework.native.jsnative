(function() {
  'use strict';

  var CLI = 'jsn-cli';
  var CAUTION_EXECUTED = '%s command should be executed in project root ' +
                         'where has tizen-manifest.xml';

  var help = module.exports;

  help.printAll = function() {
    help.printSummary();
    help.printCreate();
    help.printList();
    help.printRemove();
    help.printSign();
    help.printBuild();
  };

  help.printSummary = function() {
    var summary = 'jsn-cli: commandline tool for creating, signing and building package.\n';
    var usage = 'Usage: ' + CLI + ' <command> [args0] [args1] ...';
    console.log(summary);
    console.log(usage);
    console.log('where <command> is one of\n' +
                 '--------------------------\n' +
                 'create\tCreate a pacakge or app\n' +
                 'list\tList all apps in the package\n' +
                 'sign\tSign the package\n' +
                 'build\tBuild the package to tpk file\n' +
                 '--------------------------\n');
    console.log('Usage Example:');
  };

  help.printCreate = function() {
    var create = '$ ' + CLI + ' create (\'package\' or \'app\') (id)';
    var createEx1 = '  ex) ' + CLI + ' create package pkgid';
    var createEx2 = '  ex) ' + CLI + ' create app appid';
    console.log(create);
    console.log(createEx1);
    console.log(createEx2);
    console.log('  !!! ' + CAUTION_EXECUTED, '"app"');
  };

  help.printList = function() {
    var list = '$ ' + CLI + ' list';
    console.log('');
    console.log(list);
    console.log('  !!! ' + CAUTION_EXECUTED, '"list"');
  };

  help.printRemove = function() {
    var remove = '$ ' + CLI + ' remove (appid)';
    var removeEx = '  ex) ' + CLI + ' remove \'appid\'';
    console.log(remove);
    console.log(removeEx);
    console.log('  !!! ' + CAUTION_EXECUTED, '"remove"');
  };

  help.printSign = function() {
    var sign = '$ ' + CLI + ' sign (signer) ' +
               '(authorCAPath) (authorP12Path) (authorPwd) ' +
               '(dist1P12Path) (dist1Pwd) (dist1CAPath) ' +
               '[dist2P12Path, dist2Pwd, dist2CAPath, dist2RootPath]';
    var signExplain = '  (argv): mandatory\n  [argv]: optional,' +
                      ' all [4 parameters] have to be put together';

    var signer = '~/tizen-sdk/tools/ide/bin/native-signing';
    var authorCAPath ='~/tizen-sdk/tools/certificate-generator/certificates/' +
                      'developer/tizen-developer-ca.cer';
    var authorP12Path = '~/tizen-sdk-data/keystore/author/{AUTHOR NAME}.p12';
    var authorPwd = '{AUTHOR PASSWORD}';
    var dist1P12Path = '~/tizen-sdk/tools/certificate-generator/' +
                       'certificates/distributor/tizen-distributor-signer.p12';
    var dist1Pwd = 'tizenpkcs12passfordsigner';
    var dist1CAPath = '~/tizen-sdk/tools/certificate-generator/certificates/' +
                      'distributor/tizen-distributor-ca.cer';

    var signEx = '  ex) ' + CLI + ' sign ' + signer + ' ' + authorCAPath +
                 ' ' + authorP12Path + ' ' + authorPwd + ' ' + dist1P12Path +
                 ' ' + dist1Pwd + ' ' + dist1CAPath;

    console.log('');
    console.log(sign);
    console.log(signExplain);
    console.log(signEx);
    console.log('  !!! ' + CAUTION_EXECUTED, '"sign"');
  };

  help.printBuild = function() {
    var buildDefault = '$ ' + CLI + ' build';
    var buildSign = '$ ' + CLI + ' build sign (signer) ' +
                    '(authorCAPath) (authorP12Path) (authorPwd) ' +
                    '(dist1P12Path) (dist1Pwd) (dist1CAPath) ' +
                    '[dist2P12Path, dist2Pwd, dist2CAPath, dist2RootPath]';
    var buildSignExplain = '  (argv): mandatory\n  [argv]: optional,' +
                             ' all [4 parameters] have to be put together';

    var signer = '~/tizen-sdk/tools/ide/bin/native-signing';
    var authorCAPath ='~/tizen-sdk/tools/certificate-generator/certificates/' +
                      'developer/tizen-developer-ca.cer';
    var authorP12Path = '~/tizen-sdk-data/keystore/author/{AUTHOR NAME}.p12';
    var authorPwd = '{AUTHOR PASSWORD}';
    var dist1P12Path = '~/tizen-sdk/tools/certificate-generator/' +
                       'certificates/distributor/tizen-distributor-signer.p12';
    var dist1Pwd = 'tizenpkcs12passfordsigner';
    var dist1CAPath = '~/tizen-sdk/tools/certificate-generator/certificates/' +
                      'distributor/tizen-distributor-ca.cer';

    var buildDefaultEx = 'ex) ' + CLI + ' build';
    var buildSignEx = 'ex) ' + CLI + ' build sign ' + signer + ' ' +
                      authorCAPath + ' ' + authorP12Path + ' ' +
                      authorPwd + ' ' + dist1P12Path + ' ' +
                      dist1Pwd + ' ' + dist1CAPath;

    console.log('');
    console.log(buildDefault);
    console.log(buildSign);
    console.log(buildSignExplain);
    console.log('  ' + buildDefaultEx);
    console.log('  ' + buildSignEx);
    console.log('  !!!' + CAUTION_EXECUTED, '"build"');
    console.log('');
  };

  help.print = function(cmd) {
    switch(cmd) {
      case 'create':
      help.printCreate();
      break;
      case 'list':
      help.printList();
      break;
      case 'remove':
      help.printRemove();
      break;
      case 'sign':
      help.printSign();
      break;
      case 'build':
      help.printBuild();
      break;
      default:
      help.printAll();
      break;
    }
  };
}());