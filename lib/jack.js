(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {});
  Jack.tokenize || (Jack.tokenize = require('jack/lexer').Jack.tokenize);
  Jack.parse || (Jack.parse = require('jack/grammar').Jack.parse);

  var file = require('file');
  var sys = require('sys');
  file.read("../test.jack").addCallback(function (code) {
    var tokens = Jack.tokenize(code);
    // sys.puts(sys.inspect(tokens));
    var tree = Jack.parse(tokens);
    sys.puts(sys.inspect(tree));
  });

}());