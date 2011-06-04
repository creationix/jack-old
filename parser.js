var symbolTable = {};

var originalSymbol = {
  nud: function () {
    this.error("Undefined");
  },
  led: function (left) {
    this.error("Missing operator");
  }
};

function symbol(id, bp) {
  var s = symbolTable[id];
  bp = bp || 0;
  if (s) {
    if (bp >= s.lbp) {
      s.lbp = bp;
    }
  } else {
    s = Object.create(originalSymbol);
    s.id = s.value = id;
    s.lbp = bp;
    symbolTable[id] = s;
  }
  return s;
}

symbol(":");
symbol(";");
symbol(",");
symbol(")");
symbol("]");
symbol("}");
symbol("else");

symbol("(end)");
symbol("(name)");

