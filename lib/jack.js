(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {});
  Jack.tokenize || (Jack.tokenize = require('jack/lexer').Jack.tokenize);
  Jack.parse || (Jack.parse = require('jack/grammar').Jack.parse);
  Jack.generate || (Jack.generate = require('jack/generator').Jack.generate);
  Jack.compile = function (code) {
    var tokens, tree, js;
    try {
      tokens = Jack.tokenize(code);
      tree = Jack.parse(tokens);
      js = Jack.generate(tree);
      return js;
    } catch (e) {
      var message, num, token,
          before, after, token_before, token_after;

      // Split the jison error message.
      message = e.message.split("\n");
      num = parseInt(message[1]) - 1;
      message = message[0];

      if (tokens) {
        if (token = tokens[num]) {
          before = code.substr(0, token.offset).match(/\n?.*$/)[0];
          after = code.substr(token.offset, code.length).match(/^.*\n?/)[0];
          token_before = tokens.slice(0, num).filter(function (other_token) {
            return other_token.lineno == token.lineno;
          }).map(function (other_token) {
            return other_token.name;
          });
          token_after = tokens.slice(num).filter(function (other_token) {
            return other_token.lineno == token.lineno;
          }).map(function (other_token) {
            return other_token.name;
          });
          e.message = message  +
            " but found '" + token.name + "'\n" +
            "Line " + token.lineno + ": " + JSON.stringify(before) + " !! " + JSON.stringify(after) + "'\n" +
            "Tokens " + JSON.stringify(token_before) + " !! " + JSON.stringify(token_after);
        }
      } else {
        before = code.substr(0, num).match(/\n?.*$/)[0];
        after = code.substr(num, code.length).match(/^.*\n?/)[0];
        line_no = code.substr(0, num).split("\n").length;
        e.message = message + "\n" +
          "Line " + line_no + ": " + JSON.stringify(before) + " !! " + JSON.stringify(after);
      }
      throw e;
    }
  };

}());

var file = require('file');
process.mixin(require('sys'));
file.read("../test.jack").addCallback(function (code) {
  var js = exports.Jack.compile(code);
  puts("\nJS:\n" + js);
});
