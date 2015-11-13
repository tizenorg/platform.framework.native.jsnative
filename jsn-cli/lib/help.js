'use strict'

const CLI = 'jsn-cli';
const CAUTION_EXECUTED = '%s command should be executed in project root ' +
                       'where has tizen-manifest.xml';

const help = module.exports;

help.printAll = () => {
  help.printSummary();
  help.printCreate();
  help.printList();
  help.printRemove();
  help.printSign();
  help.printBuild();
};

help.printSummary = () => {
  const summary = 'jsn-cli: commandline tool for creating, signing and building package.\n';
  const usage = 'Usage: ' + CLI + ' <command> [args0] [args1] ...';
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

help.printCreate = () => {
  const create = '$ ' + CLI + ' create (\'package\' or \'app\') (id)';
  const createEx1 = '  ex) ' + CLI + ' create package pkgid';
  const createEx2 = '  ex) ' + CLI + ' create app appid';
  console.log(create);
  console.log(createEx1);
  console.log(createEx2);
  console.log('  !!! ' + CAUTION_EXECUTED, '"app"');
};

help.printList = () => {
  const list = '$ ' + CLI + ' list';
  console.log('');
  console.log(list);
  console.log('  !!! ' + CAUTION_EXECUTED, '"list"');
};

help.printRemove = () => {
  const remove = '$ ' + CLI + ' remove (appid)';
  const removeEx = '  ex) ' + CLI + ' remove \'appid\'';
  console.log('');
  console.log(remove);
  console.log(removeEx);
  console.log('  !!! ' + CAUTION_EXECUTED, '"remove"');
};

help.printSign = function() {
  const sign = '$ ' + CLI + ' sign (signer) ' +
             '(authorCAPath) (authorP12Path) (authorPwd) ' +
             '(dist1P12Path) (dist1Pwd) (dist1CAPath) ' +
             '[dist2P12Path, dist2Pwd, dist2CAPath, dist2RootPath]';
  const signExplain = '  (argv): mandatory\n  [argv]: optional,' +
                    ' all [4 parameters] have to be put together';

  const signer = '~/tizen-sdk/tools/ide/bin/native-signing';
  const authorCAPath ='~/tizen-sdk/tools/certificate-generator/certificates/' +
                    'developer/tizen-developer-ca.cer';
  const authorP12Path = '~/tizen-sdk-data/keystore/author/{AUTHOR NAME}.p12';
  const authorPwd = '{AUTHOR PASSWORD}';
  const dist1P12Path = '~/tizen-sdk/tools/certificate-generator/' +
                     'certificates/distributor/tizen-distributor-signer.p12';
  const dist1Pwd = 'tizenpkcs12passfordsigner';
  const dist1CAPath = '~/tizen-sdk/tools/certificate-generator/certificates/' +
                    'distributor/tizen-distributor-ca.cer';

  const signEx = '  ex) ' + CLI + ' sign ' + signer + ' ' + authorCAPath +
               ' ' + authorP12Path + ' ' + authorPwd + ' ' + dist1P12Path +
               ' ' + dist1Pwd + ' ' + dist1CAPath;

  console.log('');
  console.log(sign);
  console.log(signExplain);
  console.log(signEx);
  console.log('  !!! ' + CAUTION_EXECUTED, '"sign"');
}

help.printBuild = () => {
  const buildDefault = '$ ' + CLI + ' build';
  const buildSign = '$ ' + CLI + ' build sign (signer) ' +
                  '(authorCAPath) (authorP12Path) (authorPwd) ' +
                  '(dist1P12Path) (dist1Pwd) (dist1CAPath) ' +
                  '[dist2P12Path, dist2Pwd, dist2CAPath, dist2RootPath]';
  const buildSignExplain = '  (argv): mandatory\n  [argv]: optional,' +
                           ' all [4 parameters] have to be put together';

  const signer = '~/tizen-sdk/tools/ide/bin/native-signing';
  const authorCAPath ='~/tizen-sdk/tools/certificate-generator/certificates/' +
                    'developer/tizen-developer-ca.cer';
  const authorP12Path = '~/tizen-sdk-data/keystore/author/{AUTHOR NAME}.p12';
  const authorPwd = '{AUTHOR PASSWORD}';
  const dist1P12Path = '~/tizen-sdk/tools/certificate-generator/' +
                     'certificates/distributor/tizen-distributor-signer.p12';
  const dist1Pwd = 'tizenpkcs12passfordsigner';
  const dist1CAPath = '~/tizen-sdk/tools/certificate-generator/certificates/' +
                    'distributor/tizen-distributor-ca.cer';

  const buildDefaultEx = 'ex) ' + CLI + ' build';
  const buildSignEx = 'ex) ' + CLI + ' build sign ' + signer + ' ' +
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

help.print = cmd => {
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
