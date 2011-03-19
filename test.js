require.paths.unshift(__dirname + "/lib");
var Jack = require('jack').Jack;
var Fs = require('fs');

Fs.readFile('control_flow.jack', 'utf8', function (err, code) {
  console.log(Jack.compile(code));
});

