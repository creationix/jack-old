(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Parser = (typeof Jison !== 'undefined' && Jison.Parser) || require('jison').Parser,
      bnf, tokens, parser, name;

  bnf = {
    Root: [
      ["Block", "return $$ = {name: 'Block', value: $1}"],
      ["NEWLINE", "return $$ = {name: 'Block', value: []}"]
    ],
    Block: [
      ["Statement", "$$ = $1"],
      ["Block Statement", "$$ = $1.concat($2)"]
    ],
    Statement: [
      ["Ws COMMENT NEWLINE", "$$ = []"],
      ["Ws Expression NEWLINE", "$$ = [$2]"]
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
      ["Function", '$$ = $1']
    ],
    Ws: ["WS", ""],
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
      ["Ws ListItems", "$$ = $2"],
      ["ListBlock NEWLINE Ws ListItems", "$$ = $1.concat($4)"]
    ],
    ListItems: [
      ["Expression", "$$ = [$1]"],
      ["ListItems , Ws Expression", "$$ = $1.concat([$4])"]
    ],
    Object: [
      ["{ ObjectContents }", "$$ = {name: 'Object', value: $2}"],
      ["{ Id Ws ObjectContents }", "$$ = {name: 'Object', parent: $2, value: $4}"]
    ],
    ObjectContents: [
      ["ObjectItems", "$$ =$1"],
      ["NEWLINE ObjectBlock NEWLINE", "$$ = $2"]
    ],
    ObjectBlock: [
      ["Ws ObjectItems", "$$ = $2"],
      ["ObjectBlock NEWLINE Ws ObjectItems", "$$ = $1.concat($4)"]
    ],
    ObjectItems: [
      ["ObjectItem", "$$ = [$1]"],
      ["ObjectItems WS ObjectItem", "$$ = $1.concat([$3])"]
    ],
    ObjectItem: [
      ["Id Ws = Ws Expression", "$$ = [$1, $5]"]
    ],
    Function: [
      ["fun WS Args Ws ARROW Ws Expression", "$$ = {name: 'Function', value: [$3, $7]}"]
    ],
    Args: [
      ["", "$$ = []"],
      ["Id", "$$ = [$1]"],
      ["Args Ws , Ws Id", "$$ = $1.concat([$5])"]
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