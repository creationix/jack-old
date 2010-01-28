(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Parser = (Jison && Jison.Parser) || require('jison').Parser,
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
      ["Id ARROW", "$$ = [[$1]]"],
      ["Abstractions Id ARROW", "$$ = $1.concat([[$2]])"]
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

}());