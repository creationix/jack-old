process.mixin(require('sys'));

(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Parser = Parser || require('jison').Parser,
      bnf, tokens, parser;

  bnf = {
    Root: [
      ["Block", "return $$ = $1"]
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
      ["Literal", "$$ = $1"],
      ["Id", "$$ = $1"]
    ],
    Id: [
      ["ID", '$$ = yytext']
    ],
    Literal: [
      ["STRING", '$$ = yytext'],
      ["BOOLEAN", '$$ = yytext'],
      ["NUMBER", '$$ = yytext'],
      ["REGEX", '$$ = yytext'],
      ["INTERPOL", '$$ = yytext'],
    ]
  }

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
      this.pos++;
      this.yylineno = token.lineno;
      this.yytext = token;
      return token.name;
    },
    setInput: function (tokens) {
      this.tokens = tokens
      this.pos = 0
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
  }

}());