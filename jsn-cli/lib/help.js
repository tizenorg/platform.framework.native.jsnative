'use strict'

const CLI = 'jsn-cli';
const CAUTION_EXECUTED = '%s command should be executed in project root ' +
                       'where has tizen-manifest.xml';

const help = module.exports;

help.printAll = () => {
  console.log('');
  help.printSummary();
  console.log('');
  help.printCreate();
  console.log('');
  help.printList();
  console.log('');
  help.printRemove();
  console.log('');
  help.printSign();
  console.log('');
  help.printBuild();
  console.log('');
};

help.printSummary = () => {
  const summary = '$ ' + CLI + ' (command) (args0) (args1) [args_n] ...';
  console.log('\n\t' + summary);
  console.log('');
};

help.printCreate = () => {
  const create = '$ ' + CLI + ' create ("package" or "app") (id)';
  const createEx1 = 'ex) ' + CLI + ' create package pkgid';
  const createEx2 = 'ex) ' + CLI + ' create app appid';
  console.log('');
  console.log('\t' + create);
  console.log('\t\t' + createEx1);
  console.log('\t\t' + createEx2);
  console.log('\t\t\t !!! ' + CAUTION_EXECUTED, '"app"');
  console.log('');
};

help.printList = () => {
  const list = '$ ' + CLI + ' list';
  console.log('');
  console.log('\t' + list);
  console.log('\t\t !!! ' + CAUTION_EXECUTED, '"list"');
  console.log('');
};

help.printRemove = () => {
  const remove = '$ ' + CLI + ' remove (appid)';
  const removeEx = 'ex) ' + CLI + ' remove appa';
  console.log('');
  console.log('\t' + remove);
  console.log('\t\t !!! ' + CAUTION_EXECUTED, '"remove"');
  console.log('\t\t' + removeEx);
  console.log('');
};

help.printSign = function() {
  const sign = '$ ' + CLI + ' sign (signer) ' +
             '(authorCAPath) (authorP12Path) (authorPwd) ' +
             '(dist1P12Path) (dist1Pwd) (dist1CAPath) ' +
             '[dist2P12Path, dist2Pwd, dist2CAPath, dist2RootPath]';
  const signExplain = '(argv): must assign, [argv]: can be skipped, but ' +
                    'if you not skip these, all of [4 parameters] should ' +
                    'not be skipped';

  const signer = '~/tizen-sdk/tools/ide/bin/native-signing';
  const authorCAPath ='~/tizen-sdk/tools/certificate-generator/certificates/' +
                    'developer/tizen-developer-ca.cer';
  const authorP12Path = '~/tizen-sdk-data/keystore/author/yons.p12';
  const authorPwd = '1234';
  const dist1P12Path = '~/tizen-sdk/tools/certificate-generator/' +
                     'certificates/distributor/tizen-distributor-signer.p12';
  const dist1Pwd = 'tizenpkcs12passfordsigner';
  const dist1CAPath = '~/tizen-sdk/tools/certificate-generator/certificates/' +
                    'distributor/tizen-distributor-ca.cer';

  const signEx = 'ex) ' + CLI + ' sign ' + signer + ' ' + authorCAPath +
               ' ' + authorP12Path + ' ' + authorPwd + ' ' + dist1P12Path +
               ' ' + dist1Pwd + ' ' + dist1CAPath;

  console.log('');
  console.log('\t' + sign);
  console.log('\t' + signExplain);
  console.log('\t\t !!! ' + CAUTION_EXECUTED, '"sign"');
  console.log('\t\t' + signEx);
  console.log('');
}

help.printBuild = () => {
  const buildDefault = '$ ' + CLI + ' build';
  const buildNoSign = '$ ' + CLI + ' build nosign';
  const buildSign = '$ ' + CLI + ' build sign (signer) ' +
                  '(authorCAPath) (authorP12Path) (authorPwd) ' +
                  '(dist1P12Path) (dist1Pwd) (dist1CAPath) ' +
                  '[dist2P12Path, dist2Pwd, dist2CAPath, dist2RootPath]';
  const buildSignExplain = '(argv): must assign, [argv]: can be skipped, ' +
                         'but if you not skip these, all of [4 parameters] ' +
                         'should not be skipped';

  const signer = '~/tizen-sdk/tools/ide/bin/native-signing';
  const authorCAPath ='~/tizen-sdk/tools/certificate-generator/certificates/' +
                    'developer/tizen-developer-ca.cer';
  const authorP12Path = '~/tizen-sdk-data/keystore/author/yons.p12';
  const authorPwd = '1234';
  const dist1P12Path = '~/tizen-sdk/tools/certificate-generator/' +
                     'certificates/distributor/tizen-distributor-signer.p12';
  const dist1Pwd = 'tizenpkcs12passfordsigner';
  const dist1CAPath = '~/tizen-sdk/tools/certificate-generator/certificates/' +
                    'distributor/tizen-distributor-ca.cer';

  const buildDefaultEx = 'ex) ' + CLI + ' build';
  const buildNoSignEx = 'ex) ' + CLI + ' build nosign';
  const buildSignEx = 'ex) ' + CLI + ' build sign ' + signer + ' ' +
                    authorCAPath + ' ' + authorP12Path + ' ' +
                    authorPwd + ' ' + dist1P12Path + ' ' +
                    dist1Pwd + ' ' + dist1CAPath;

  console.log('');
  console.log('\t' + buildDefault);
  console.log('\t' + buildNoSign);
  console.log('\t\t' + 'build nosign == build (no parameters)')
  console.log('\t' + buildSign);
  console.log('\t' + buildSignExplain);
  console.log('\t\t' + CAUTION_EXECUTED, '"build"');
  console.log('\t\t' + buildDefaultEx);
  console.log('\t\t' + buildNoSignEx);
  console.log('\t\t' + buildSignEx);
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
