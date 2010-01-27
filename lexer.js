Booleans = [
  "true", "false",
  "on",   "off",
  "yes",  "no"
];

Keywords = [
  "fun", "return"
];

Tokens = {
  ID: /^([a-z_$][a-z0-9_$]*)\b/i,
  WS: /^([ \t]+)/,
  COMMENT: /^(#.*)\n/,
  NEWLINE: /^([ \t]*\n)/,
  NUMBER: /^(0x[0-9a-f]+|-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-]?[0-9]+)?)\b/i,
  STRING: /^('(\\.|[^'])*')/,
  INTERPOL: /^(([a-z$_][a-z0-9$_]*)?"(\/.|[^"])*")/i,
  STRING_HEREDOC: /^('''\n(?:[^']|'[^']|''[^']|\\')*\n[ \t]*''')/,
  INTERPOL_HEREDOC: /^(([a-z$_][a-z0-9$_]*)?"""\n(?:[^"]|"[^"]|""[^"]|\\")*\n[ \t]*""")/i,
  REGEX: /^(\/(?:\\\/|[^\/])*\/[img]*)/,
  CODE: /^([\[\]\{\},=])/,
  OPERATOR: /^([*\/+-])/,
  ARROW: /^(->)/
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

embedder = /\$(?:([a-z$_][a-z0-9$_]*)|\{([^}]*)\})/i;

function strip_heredoc(value) {
  var indent;
  value = value.substr(4, value.length - 7);
  indent = value.match(/\n([ \t]*)$/)[1];
  value = value.substr(0, value.length - indent.length - 1);
  return value.split("\n").map(function (line) {
    return line.substr(indent.length);
  }).join("\n");
}

function break_interpol(value) {
  var items = [],
      pos = 0,
      next = 0;
  while (true) {
    // Match up to embedded string
    next = value.substr(pos).search(embedder);
    if (next < 0) {
      if (pos < value.length) {
        items.push(value.substr(pos));
      }
      break;
    }
    items.push(value.substr(pos, next));
    pos += next

    // Match embedded string
    match = value.substr(pos).match(embedder);
    next = match[0].length;
    if (next < 0) { break; }
    items.push(match[1] || match[2]);
    pos += next;
  }
  return items;
}

function analyse(tokens) {
  var last, name;
  return tokens.map(function (token) {
    var index, pos, next, value, match;
    last = name;
    value = token.value;
    name = token.name;
    if (name === "NEWLINE" && last === "NEWLINE") {
      return false;
    }
    if (name === "STRING") {
      token.value = JSON.parse(value);
    }
    if (name === "STRING_HEREDOC") {
      token.name = "STRING";
      token.value = strip_heredoc(value);
    }
    if (name === "INTERPOL" || name === "INTERPOL_HEREDOC") {
      index = value.indexOf('"');
      token.type = value.substr(0, index);
      value = value.substr(index);
      if (name === "INTERPOL_HEREDOC") {
        token.name = "INTERPOL";
        token.value = break_interpol(strip_heredoc(value));
      } else {
        token.value = break_interpol(JSON.parse(value));
      }
    }
    if (name === "COMMENT") {
      token.value = value.substr(1);
    }
    if (name === "ID") {
      if ((index = Booleans.indexOf(value)) >= 0) {
        token.name = "BOOLEAN";
        token.value = index % 2 == 0;
      }
      if ((index = Keywords.indexOf(value)) >= 0) {
        token.name = value;
        delete token.value;
      }
    }
    if (name === "NUMBER") {
      if ((index = value.indexOf(".")) >= 0) {
        token.value = parseFloat(value);
      } else {
        if (value.match(/x/i)) {
          token.value = value.toLowerCase();
        } else {
          token.value = parseInt(value);
        }
      }
    }

    return token;
  }).filter(function (token) { return token; });
}

function tokenize(code) {
  var offset = 0,
      length = code.length,
      tokens = [],
      match;
  while (offset < length) {
    match = find_longest(code.substr(offset));
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
  return analyse(tokens);
}

file.read("data_types.jack").addCallback(function (code) {
  // sys.puts(code);
  sys.puts(sys.inspect(tokenize(code)));
});