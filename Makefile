all: single

single:
	echo "// jack/lexer.js\n" > public/jack.js
	cat lib/jack/lexer.js >> public/jack.js
	echo "\n// jack/grammar.js\n" >> public/jack.js
	cat lib/jack/grammar.js >> public/jack.js
	echo "\n// jack/generator.js\n" >> public/jack.js
	cat lib/jack/generator.js >> public/jack.js
	echo "\n// jack.js\n" >> public/jack.js
	cat lib/jack.js >> public/jack.js

# Requires that compiler.jar be in the parent directory.
# See google closure for details
compressed: single
	java -jar ../compiler.jar --js public/jack.js  -js_output_file public/jack-min.js

