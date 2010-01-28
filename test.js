var Jack = require('jack').Jack;
var File = require('file');
process.mixin(require('sys'));

File.read('test.jack').addCallback(function (code) {
  puts(Jack.compile(code));
});
