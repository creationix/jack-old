(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Parser = (typeof Jison !== 'undefined' && Jison.Parser) || require('jison').Parser,
      bnf, tokens, parser, name;

  bnf = {
    Root: [
      ["Block", "return $$ = $1"]
    ],
    Block: [
      ["BlockPart", "$$ = {name: 'Block', value: $1}"],
      ["NEWLINE", "$$ = {name: 'Block', value: []}"],
      ["", "$$ = {name: 'Block', value: []}"]
    ],
    BlockPart: [
      ["Statement", "$$ = $1"],
      ["BlockPart Statement", "$$ = $1.concat($2)"]
    ],
    Statement: [
      ["NEWLINE", "$$ = []"],
      ["Comment NEWLINE", "$$ = [$1]"],
      ["Expression NEWLINE", "$$ = [$1]"]
    ],
    Comment: [
      ["COMMENT", "$$ = yytext"]
    ],
    Expression: [
      ["STRING", '$$ = yytext'],
      ["BOOLEAN", '$$ = yytext'],
      ["NUMBER", '$$ = yytext'],
      ["REGEX", '$$ = yytext'],
      ["INTERPOL", '$$ = yytext'],
      ["Assign", '$$ = $1'],
      ["Id", "$$ = $1"],
      ["List", '$$ = $1'],
      ["Object", '$$ = $1'],
      ["Function", '$$ = $1'],
      ["If", "$$ = $1"]
    ],
    Ws: ["WS", ""],
    If: [
      ["if Ws Expression NEWLINE Block end", '$$ = {name: "If", condition: $3, yes: $5}'],
      ["if Ws Expression NEWLINE Block else NEWLINE Block end", '$$ = {name: "If", condition: $3, yes: $5, no: $8}']
    ],
    Assign: [
      ["Id Ws = Ws Expression", '$$ ={name: "Assign", id: $1, value: $5}']
    ],
    Id: [
      ["ID", '$$ = yytext']
    ],
    List: [
      ["[ Ws ListContents Ws ]", "$$ = {name: 'List', value: $3}"],
      ["[ Id Ws ListContents Ws ]", "$$ = {name: 'List', parent: $2, value: $4}"]
    ],
    ListContents: [
      ["ListItems", "$$ = $1"],
      ["NEWLINE ListBlock NEWLINE", "$$ = $2"]
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
      ["{ Id WS ObjectItems }", "$$ = {name: 'Object', parent: $2, value: $4}"],
      ["{ NEWLINE ObjectBlock NEWLINE }", "$$ = {name: 'Object', value: $3}"],
      ["{ Id NEWLINE ObjectBlock NEWLINE }", "$$ = {name: 'Object', parent: $2, value: $4}"],
      ["{ Id }", "$$ = {name: 'Object', parent: $2, value: []}"]
    ],
    ObjectBlock: [
      ["ObjectItems", "$$ = $1"],
      ["ObjectBlock NEWLINE ObjectItems", "$$ = $1.concat($3)"]
    ],
    ObjectItems: [
      ["ObjectItem", "$$ = [$1]"],
      ["ObjectItems WS ObjectItem", "$$ = $1.concat([$3])"]
    ],
    ObjectItem: [
      ["Id = Expression", "$$ = [$1, $3]"]
    ],
    Function: [
      ["fun Ws Args ARROW Expression", "$$ = {name: 'Function', value: [$3, $5]}"],
      ["fun Ws Args ARROW NEWLINE Block end", "$$ = {name: 'Function', value: [$3, $6]}"]
    ],
    Args: [
      ["", "$$ = []"],
      ["Id", "$$ = [$1]"],
      ["Args , Id", "$$ = $1.concat([$3])"]
    ]
  };

  // Calculate the tokens from what's left in the grammar.
  tokens = [];
  for (name in bnf) {
    if (bnf.hasOwnProperty(name)) {
      bnf[name].forEach(function (option) {
        if (typeof option === "object") {
          option[0].split(" ").forEach(function (part) {
            if (!bnf[part] && tokens.indexOf(part) < 0) {
              tokens.push(part);
            }
          });
        }
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