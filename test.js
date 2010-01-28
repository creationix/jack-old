var Jack = require('jack').Jack;
var File = require('file');
process.mixin(require('sys'));

File.read('control_flow.jack').addCallback(function (code) {
  puts(Jack.compile(code));
});
