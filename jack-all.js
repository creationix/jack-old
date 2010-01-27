process.mixin(require('sys'));

(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Generators;

  Generators = {

    Block: function (node) {
      return node.value.map(render).join("\n");

    },

    BOOLEAN: function (node) {
      return node.value ? "true" : "false";
    },

    STRING: function (node) {
      return JSON.stringify(node.value);
    },

    List: function (node) {
      return "[" + node.value.map(render).join(", ") + "]";
    },

    Object: function (node) {
      return "{" + node.value.map(function (pair) {
        return render(pair[0]) + ": " + render(pair[1]);
      }).join(", ") + "}";
    },

    INTERPOL: function (node) {
      var raw = false, values;
      values = node.value.map(function (item) {
        if (raw = !raw) {
          return JSON.stringify(item);
        }
        return item;
      })
      if (node.type) {
        return node.type + ".interpolate([" + values.join(", ") + "])";
      }
      values = values.filter(function (item) {
        return item !== '""';
      });
      if (values.length === 0) {
        return '""';
      }
      if (values.length === 1) {
        return values[0];
      }
      return "(" + values.join(" + ") + ")";
    }

  };

  function render(node) {
    if (!node) {
      return "";
    }
    if (Generators[node.name]) {
      return Generators[node.name](node);
    }
    if ((typeof node.name == "string" && node.name.match(/^[A-Z]+$/))) {
      return node.value;
    }
    return JSON.stringify(node);
  }

  Jack.generate = function (tree) {
    // puts(inspect(tree));
    return render(tree);
  };

}());(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Parser = Parser || require('jison').Parser,
      bnf, tokens, parser, name;

  bnf = {
    Root: [
      ["Block", "return $$ = {name: 'Block', value: $1}"]
    ],
    Block: [
      ["Statement", "$$ = $1"],
      ["Block Statement", "$$ = $1.concat($2)"]
    ],
    Statement: [
      ["COMMENT NEWLINE", "$$ = []"],
      ["Expression NEWLINE", "$$ = [$1]"]
    ],
    Expression: [
      ["STRING", '$$ = yytext'],
      ["BOOLEAN", '$$ = yytext'],
      ["NUMBER", '$$ = yytext'],
      ["REGEX", '$$ = yytext'],
      ["INTERPOL", '$$ = yytext'],
      ["Id", "$$ = $1"],
      ["List", '$$ = $1'],
      ["Object", '$$ = $1'],
      ["Function", '$$ = $1']
    ],
    Id: [
      ["ID", '$$ = yytext']
    ],
    List: [
      ["[ ListItems ]", "$$ = {name: 'List', value: $2}"],
      ["[ NEWLINE ListBlock NEWLINE ]", "$$ = {name: 'List', value: $3}"],
      ["[ Id ListItems ]", "$$ = {name: 'List', parent: $2, value: $3}"],
      ["[ Id NEWLINE ListBlock NEWLINE ]", "$$ = {name: 'List', parent: $2, value: $4}"]
    ],
    ListBlock: [
      ["ListItems", "$$ = $1"],
      ["ListBlock NEWLINE ListItems", "$$ = $1.concat($3)"]
    ],
    ListItems: [
      ["Expression", "$$ = [$1]"],
      ["ListItems , Expression", "$$ = $1.concat([$3])"]
    ],
    Object: [
      ["{ ObjectItems }", "$$ = {name: 'Object', value: $2}"],
      ["{ NEWLINE ObjectBlock NEWLINE }", "$$ = {name: 'Object', value: $3}"],
      ["{ Id ObjectItems }", "$$ = {name: 'Object', parent: $2, value: $3}"],
      ["{ Id NEWLINE ObjectBlock NEWLINE }", "$$ = {name: 'Object', parent: $2, value: $4}"]
    ],
    ObjectBlock: [
      ["ObjectItems", "$$ = $1"],
      ["ObjectBlock NEWLINE ObjectItems", "$$ = $1.concat($3)"]
    ],
    ObjectItems: [
      ["ObjectItem", "$$ = [$1]"],
      ["ObjectItems ObjectItem", "$$ = $1.concat([$2])"]
    ],
    ObjectItem: [
      ["Id = Expression", "$$ = [$1, $3]"]
    ],
    Function: [
      ["fun Abstractions Expression", "$$ = {name: 'Function', value: [$2, $3]}"]
    ],
    Abstractions: [
      ["Id ARROW", "$$ = [$1]"],
      ["Abstractions Id ARROW", "$$ = $1.concat([$2])"]
    ],
    Args: [
      ["Id", "$$ = [$1]"],
      ["Args , Id", "$$ = $1.concat([$3])"]
    ]
  };

  // Calculate the tokens from what's left in the grammar.
  tokens = [];
  for (name in bnf) {
    if (bnf.hasOwnProperty(name)) {
      bnf[name].forEach(function (option) {
        option[0].split(" ").forEach(function (part) {
          if (!bnf[part] && tokens.indexOf(part) < 0) {
            tokens.push(part);
          }
        });
      });
    }
  }

  parser = new Parser({bnf: bnf, tokens: tokens.join(" ")});

  parser.lexer = {
    lex: function () {
      var token = this.tokens[this.pos];
      if (!token) {
        this.yylineno = "END";
        return "";
      }
      this.pos += 1;
      this.yylineno = token.lineno - 1;
      this.yytext = token;
      return token.name;
    },
    setInput: function (tokens) {
      this.tokens = tokens;
      this.pos = 0;
    },
    upcomingInput: function () {
      return "";
    },
    showPosition: function () {
      return this.pos;
    }
  };



  Jack.parse = function () {
    return parser.parse.apply(parser, arguments);
  };

}());(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Booleans, Keywords, Tokens, embedder;

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
    NUMBER: /^(0x[0-9a-f]+|-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+\-]?[0-9]+)?)\b/i,
    STRING: /^('(\\.|[^'])*')/,
    INTERPOL: /^(([a-z$_][a-z0-9$_]*)?"(\\.|[^"])*")/i,
    STRING_HEREDOC: /^('''\n(?:[^']|'[^']|''[^']|\\')*\n[ \t]*''')/,
    INTERPOL_HEREDOC: /^(([a-z$_][a-z0-9$_]*)?"""\n(?:[^"]|"[^"]|""[^"]|\\")*\n[ \t]*""")/i,
    REGEX: /^(\/(?:\\\/|[^\/])*\/[img]*)/,
    CODE: /^([\[\]\{\},=])/,
    OPERATOR: /^([*\/+\-])/,
    ARROW: /^(->)/
  };


  // Used to find embedded code in interpolated strings.
  embedder = /\$(?:([a-z$_][a-z0-9$_]*)|\{([^}]*)\})/i;

  // Turn a raw heredoc code capture into a raw string value.
  function strip_heredoc(value) {
    var indent;
    value = value.substr(4, value.length - 7);
    indent = value.match(/\n([ \t]*)$/)[1];
    value = value.substr(0, value.length - indent.length - 1);
    return value.split("\n").map(function (line) {
      return line.substr(indent.length);
    }).join("\n");
  }

  // Split interpolated strings into an array of literals and code fragments.
  function split_interpol(value) {
    var items = [],
        pos = 0,
        next = 0,
        match;
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
      pos += next;

      // Match embedded string
      match = value.substr(pos).match(embedder);
      next = match[0].length;
      if (next < 0) { break; }
      items.push(match[1] || match[2]);
      pos += next;
    }
    return items;
  }

  // Take the raw token stream and clean it up a bit.
  function analyse(tokens) {
    var last, name;
    return tokens.map(function (token) {
      var index, value;
      last = name;
      value = token.value;
      name = token.name;
      switch (name) {
        case "NEWLINE":
          if (last === "NEWLINE") {
            return false;
          }
          break;
        case "WS":
          return false;
        case "CODE":
          token.name = token.value;
          delete token.value;
          break;
        case "STRING":
          token.value = JSON.parse(value);
          break;
        case "STRING_HEREDOC":
          token.name = "STRING";
          token.value = strip_heredoc(value);
          break;
        case "INTERPOL":
        case "INTERPOL_HEREDOC":
          index = value.indexOf('"');
          if (index > 0) {
            token.type = value.substr(0, index);
            value = value.substr(index);
          }
          if (name === "INTERPOL_HEREDOC") {
            token.name = "INTERPOL";
            token.value = split_interpol(strip_heredoc(value));
          } else {
            token.value = split_interpol(JSON.parse(value));
          }
          break;
        case "COMMENT":
          token.value = value.substr(1);
          break;
        case "ID":
          if ((index = Booleans.indexOf(value)) >= 0) {
            token.name = "BOOLEAN";
            token.value = index % 2 === 0;
          }
          if ((index = Keywords.indexOf(value)) >= 0) {
            token.name = value;
            delete token.value;
          }
          break;
        case "NUMBER":
          if ((index = value.indexOf(".")) >= 0) {
            token.value = parseFloat(value);
          } else {
            if (value.match(/x/i)) {
              token.value = value.toLowerCase();
            } else {
              token.value = parseInt(value, 10);
            }
          }
          break;
      }

      return token;
    }).filter(function (token) { return token; });
  }

  // Find the token type that matches the most code.
  function find_longest(code) {
    var match, longest, name;
    for (name in Tokens) {
      if (Tokens.hasOwnProperty(name)) {
        match = Tokens[name](code);
        if (match && (!longest || match[1].length > longest.value.length)) {
          longest = {
            name: name,
            value: match[1]
          };
        }
      }
    }
    return longest;
  }

  // Turn the stream of text into a stream of tokens based on the regexps.
  function tokenize(code) {
    var offset = 0,
        length = code.length,
        tokens = [],
        lineno,
        match;
    while (offset < length) {
      match = find_longest(code.substr(offset));
      if (!match) {
        lineno = code.substr(0, offset).split("\n").length;
        throw new Error("Lexer error on line " + lineno + ". Unrecognized input\n" + (offset + 1));
      }
      tokens.push({
        name: match.name,
        value: match.value,
        offset: offset,
        lineno: code.substr(0, offset).split("\n").length
      });
      offset += match.value.length;
    }
    return analyse(tokens);
  }

  Jack.tokenize = tokenize;

}());
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
file.read("test.jack").addCallback(function (code) {
  var js = exports.Jack.compile(code);
  puts("\nJS:\n" + js);
});
