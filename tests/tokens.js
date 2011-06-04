var Assert = require('assert'),
    Path = require('path'),
    Fs = require('fs'),
    Lex = require('../lexer');

var fixtures = [
  '""', [{ type: 'string', value: '' }],
  "''", [{ type: 'string', value: '' }],
  '"Hello"', [{ type: 'string', value: 'Hello' }],
  "'Hello'", [{ type: 'string', value: 'Hello' }],
  '"\u79c1\u306fJavaScript\u3092\u611b\u3057\u3066"', [{ type: 'string', value: '\u79c1\u306fJavaScript\u3092\u611b\u3057\u3066' }],
  "'\\u79c1\\u306fJavaScript\\u3092\\u611b\\u3057\\u3066'",  [{ type: 'string', value: '\u79c1\u306fJavaScript\u3092\u611b\u3057\u3066' }],
  '"\\"Hello\\""', [{ type: 'string', value: '"Hello"' }],
  '"\\\\\\/\\b\\f\\n\\r\\t"', [{ type: 'string', value: '\\\/\b\f\n\r\t' }],
  '"\\\'"', [{ type: 'string', value: "'" }],
  "'\\\''", [{ type: 'string', value: "'" }],
  '"""\nThis\nis multiline"""', [{ type: 'string', value: 'This\nis multiline' }],
  "'''\nAnd so\nis this'''", [{ type: 'string', value: 'And so\nis this' }],
  "HTML'''\n<!doctype html>\n<html>\n  <head>\n    <title>$title</title>\n  </head>\n  <body>\n  </body>\n</html>\n'''", [{type: 'name', value: 'HTML'}, { type: 'string', value: '<!doctype html>\n<html>\n  <head>\n    <title>$title</title>\n  </head>\n  <body>\n  </body>\n</html>\n' }],
  '"""\n\\n\\r\\t\\0\n"""', [{ type: 'string', value: '\n\r\t\0\n' }],
  '"""\n    How about indented multiline\n    That\'s cool isn\'t it?\n    """', [{ type: 'string', value: 'How about indented multiline\nThat\'s cool isn\'t it?\n' }],
  '"""\n\t\tHow about indented multiline\n\t\tThis time with tabs\n\t\t"""', [{ type: 'string', value: 'How about indented multiline\nThis time with tabs\n' }],
  '"""\n  forced indent\n"""', [{ type: 'string', value: '  forced indent\n' }],
];


var input;
for (var i = 0, l = fixtures.length; i < l; i++) {
  if (i % 2) {
    var expected = fixtures[i];
    var actual = Lex(input);
    Assert.deepEqual(actual, expected, ((i + 1) / 2) + " Expected " + JSON.stringify(expected) + " but got " + JSON.stringify(actual));
  } else {
    input = fixtures[i];
  }
}


function lexFile(filename) {
  filename = Path.resolve(filename);
  return Lex(Fs.readFileSync(filename, 'utf8'), filename);
}

