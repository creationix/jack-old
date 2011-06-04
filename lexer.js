
function lex(string, filename) {
  var i = 0, length = string.length;
  var tokens = [];
  var state = 0;
  var line = 1;
  var column = 1;
  
  var value, quote;
  while (i < length) {
    var c = string[i];
//    console.log("%d %d:%d state-%d: %s", i, line, column, state, JSON.stringify(c));
    switch (state) {
    case 0: // starting state

      // Ignore horizontal white-space
      if (c === " " || c === "\t") { break; }

      // Treat vertical white-space as operators
      if (c === "\n" || c === "\r") {
        tokens.push({type: "operator", value: "\n"});
        column = 0;
        line++;
        break;
      }
      
      // Look for the start of identifiers and keywords
      if ((c >= "a" && c <= "z") ||
          (c >= "A" && c <= "Z") ||
          c === "$" || c === "_") {
        value = c;
        state = 1;
        break;
      }
      
      // Look for the start of numbers
      if (c >= "0" && c <= "9") {
        value = c;
        state = 2;
        break;
      }
      
      // Look for the start of strings
      if (c === "'" || c === '"') {
        quote = c;
        value = "";
        state = 3;
        break;
      }
      
      // The rest are operators
      if ((c >= "!" && c <= "~")) {
        tokens.push({type: "operator", value: c});
        break;
      }
      
      error("Unexpected character " + JSON.stringify(c));
      break;

    case 1: // name
      if ((c >= "a" && c <= "z") ||
          (c >= "A" && c <= "Z") ||
          (c >= "0" && c <= "9") ||
          c === "$" || c === "_") {
        value += c;
        break;
      }
      tokens.push({type: "name", value: value});
      state = 0;
      value = undefined;
      continue;

    case 2: // number
      if ((c >= 0 && c <= 9) || c === "." || c === "e"  || c === "E" || c === "+" || c === "-") {
        value += c;
        break;
      }
      tokens.push({type: "number", value: value});
      state = 0;
      value = undefined;
      continue;
    
    case 3: // string
      if (c === "\\") {
        state = 4;
        break;
      }
      if (c === "\n") {
        error("Newlines are not allowed in normal strings");
      }
      
      if (c !== quote) {
        value += c;
        break;
      }
      
      if (value.length === 0) {
        state = 5;
        break;
      }
      
      tokens.push({type: "string", value: value});
      state = 0;
      quote = value = undefined;
      break;
    
    case 4: case 7: // ignore next 
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
      // TODO: Implement /uXXXX style strings
      else value += c;
      state--;
      break;
    
    case 5: // maybe end string
      if (c === quote) {
        state = 6;
        break;
      }
      tokens.push({type: "string", value: value});
      state = 0;
      quote = value = undefined;
      continue;
    
    case 6: // heredoc string
      if (c === quote && string[i + 1] === quote && string[i + 2] === quote) {
        tokens.push({type: "string", value: value});
        state = 0;
        quote = value = undefined;
        i += 3;
        continue;
      }
      if (c === "\\") {
        state = 7;
        break;
      }
      value += c;
      break;
    
    default: error("State " + state + " not implemented!");
    }

    column++;
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
    newTokens.push(token);
  }
  
  return newTokens
}


function lexFile(filename) {
  filename = require('path').resolve(filename);
  return lex(require('fs').readFileSync(filename, 'utf8'), filename);
}
console.dir(lex("var a = 42;"));
console.dir(lex("\"\\n\\r\\t\\0\\1\\2\\3\\/\\\\\""));
console.dir(lexFile("tests/basics.js"));
console.dir(lexFile("tests/strings.js"));
console.dir(lexFile("tests/basics.jack"));
console.dir(lexFile("tests/strings.jack"));

