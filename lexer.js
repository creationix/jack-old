Tokens = {
  ID: /^([a-z_$][a-z0-9_$]*)\b/i,
  WS: /^([ \t]+)/,
  COMMENT: /^(#.*)\n/,
  NEWLINE: /^(\n)/,
  NUMBER: /^(0x[0-9a-f]+|-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-][0-9+])?)\b/i,
  STRING: /^('(\\.|[^'])*')/,
  INTERPOL: /^("(\/.|[^"])*")/,
  STRING_HEREDOC: /^('''(?:[^']|'[^']|''[^']|\\')*''')/,
  INTERPOL_HEREDOC: /^("""(?:[^"]|"[^"]|""[^"]|\\")*""")/,
  REGEX: /^(\/(?:\\\/|[^\/])*\/[img]*)/
};

var file = require('file');
var sys = require('sys');

function error(message, offset) {
  return new Error("Syntax Error at " + offset + "\n" + message);
}

function find_longest(code) {
  var match, longest;
  for (name in Tokens) {
    match = Tokens[name](code);
    if (match && (!longest || match[1].length > longest.value.length)) {
      longest = {
        name: name,
        value: match[1]
      };
    }
  }
  return longest;
}

function tokenize(code) {
  var offset = 0,
      length = code.length,
      tokens = [],
      match;
  while (offset < length) {
    match = find_longest(code.substr(offset, length));
    if (!match) {
      sys.puts(sys.inspect(tokens));
      throw error("Unrecognized input " + JSON.stringify(code.substr(offset, 20)), offset);
    }
    tokens.push({
      name: match.name,
      value: match.value,
      offset: offset
    });
    offset += match.value.length;
  }
  return tokens;
}

file.read("data_types.jack").addCallback(function (code) {
  // sys.puts(code);
  sys.puts(sys.inspect(tokenize(code)));
});