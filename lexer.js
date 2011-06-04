var START        = 0x00,
    NAME         = 0x10,
    NUMBER       = 0x20,
    STRING       = 0x30,
    STRING_SKIP  = 0x31,
    HEREDOC      = 0x38,
    HEREDOC_SKIP = 0x39,
    COMMENT      = 0x40,
    COMMENT_MULTILINE = 0x48;

var hex4reg = /^[0-9a-f]{4}/i;

function lex(string, filename) {
  var i = 0, length = string.length;
  var tokens = [];
  var state = START;
  var line = 0;
  var lineOffset = 0;
  
  var value, quote;
  while (i < length) {
    var column = i - lineOffset;
    var c = string[i];
//    console.log("%d %d:%d state-0x%s: %s", i, line, column, state.toString(16), JSON.stringify(c));
    switch (state) {
    case START:

      // Ignore horizontal white-space
      if (c === " " || c === "\t") { break; }

      // Treat vertical white-space as operators
      if (c === "\n" || c === "\r") {
        tokens.push({type: "operator", value: "\n"});
        column = 0;
        line++;
        i++;
        lineOffset = i;
        continue;
      }
      
      // Look for the start of identifiers and keywords
      if ((c >= "a" && c <= "z") ||
          (c >= "A" && c <= "Z") ||
          c === "$" || c === "_") {
        value = c;
        state = NAME;
        break;
      }
      
      // Look for the start of numbers
      if (c >= "0" && c <= "9") {
        value = c;
        state = NUMBER;
        break;
      }
      
      // Look for the start of strings
      if (c === "'" || c === '"') {
        quote = c;
        value = "";
        if (string[i + 1] === quote && string[i + 2] === quote && string[i + 3] === "\n") {
          state = HEREDOC;
          i += 4;
          continue;
        }
        state = STRING;
        break;
      }
      
      if (c === "/") {
        var next = string[i + 1];
        if (next === "/") {
          state = COMMENT;
          value = "";
          i += 1;
          break;
        }
        if (next === "*") {
          state = COMMENT_MULTILINE;
          value = "";
          i += 1;
          break;
        }
      }
      
      // The rest are operators
      if ((c >= "!" && c <= "~")) {
        tokens.push({type: "operator", value: c});
        break;
      }
      
      error("Unexpected character " + JSON.stringify(c));
      break;

    case NAME:
      if ((c >= "a" && c <= "z") ||
          (c >= "A" && c <= "Z") ||
          (c >= "0" && c <= "9") ||
          c === "$" || c === "_") {
        value += c;
        break;
      }
      tokens.push({type: "name", value: value});
      state = START;
      value = undefined;
      continue;

    // This is pretty lax.  It actually lets invalid numbers through.
    // The plus side is that is leaves the original formatting as is.
    // Maybe later we can validate a little more and preserve the only class of formatting
    // IE: hex, octal, decimal, scientific
    case NUMBER: // number
      if ((c >= "0" && c <= "9") || c === "." || c === "e"  || c === "E" || c === "+" || c === "-") {
        value += c;
        break;
      }
      tokens.push({type: "number", value: value});
      state = START;
      value = undefined;
      continue;
    
    case STRING:
      if (c === "\\") {
        state = STRING_SKIP;
        break;
      }
      if (c === "\n") {
        error("Newlines are not allowed in normal strings");
      }
      
      if (c !== quote) {
        value += c;
        break;
      }
      
      tokens.push({type: "string", value: value});
      state = START;
      quote = value = undefined;
      break;

    case HEREDOC:
      if (c === quote && string[i + 1] === quote && string[i + 2] === quote) {
        tokens.push({type: "heredoc", value: value});
        state = START;
        quote = value = undefined;
        i += 3;
        continue;
      }
      if (c === "\\") {
        state = HEREDOC_SKIP;
        break;
      }
      value += c;
      break;
    
    case STRING_SKIP: case HEREDOC_SKIP:
      if (c === "n") value += "\n";
      else if (c === "r") value += "\r";
      else if (c === "t") value += "\t";
      else if (c === "f") value += "\f";
      else if (c === "b") value += "\b";
      else if (c === "v") value += "\v";
      else if (c === "0") value += "\0";
      else if (c === "1") value += "\1";
      else if (c === "2") value += "\2";
      else if (c === "3") value += "\3";
      else if (c === "4") value += "\4";
      else if (c === "5") value += "\5";
      else if (c === "6") value += "\6";
      else if (c === "7") value += "\7";
      else if (c === "u" && hex4reg.test(string.substr(i + 1, 4))) {
        value += String.fromCharCode(parseInt(string.substr(i + 1, 4), 16));
        i += 4;
      }
      else value += c;
      state--;
      break;
    
    case COMMENT:
      if (c === "\n" || c === "\r") {
        tokens.push({type: "comment", value: value});
        value = undefined;
        state = START;
        continue;
      }
      value += c;
      break;

    case COMMENT_MULTILINE:
      if (c === "*" && string[i + 1] === "/") {
        tokens.push({type: "comment_multiline", value: value});
        value = undefined;
        state = START;
        i++;
        break;
      }
      value += c;
      break;
    
    default: error("State 0x" + state.toString(16) + " not implemented!");
    }

    i++;
  }
  return postProcess(tokens);

  function error(message) {
    throw new SyntaxError(message + " (" + filename + ":" + line + ":" + column + ")");
  }


}

function postProcess(tokens) {
  var newTokens = [];

  // implement ASI
  for (var i = 0, l = tokens.length; i < l; i++) {
    var token = tokens[i];
    if (token.type === "operator" && token.value === "\n") {
      var next = tokens[i + 1];
      if (!next) { continue; }
      if (!(next.type === "operator" && (next.value === "[" || next.value === "("))) {
        token.value = ";";
      }
    }
    else if (token.type === "heredoc") {
      token.type = "string";
      token.value = blockTrim(token.value);
    }
    newTokens.push(token);
  }
  
  return newTokens
}

function blockTrim(value) {
  var indent;
  var lines = value.split("\n");
  lines.forEach(function (line, index) {
    if (index < lines.length - 1 && line.trim().length === 0) return;
    var m = line.match(/^[ \t]*/);
    var i = m[0].length;
    if (indent === undefined || i < indent) indent = i
  });
  return lines.map(function (line) {
    return line.substr(indent);
  }).join("\n");
}

module.exports = lex;
