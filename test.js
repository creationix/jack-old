var Jack = require('jack').Jack;
var File = require('file');
process.mixin(require('sys'));

File.read('data_types.jack').addCallback(function (code) {
  puts(Jack.compile(code));
});
