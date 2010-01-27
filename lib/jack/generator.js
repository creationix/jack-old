process.mixin(require('sys'));

(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Generators;

  Generators = {
    Block: function (node) {
      return node.value.map(this).join("\n");

    },
    BOOLEAN: function (node) {
      return node.value ? "true" : "false";
    }

  };

  function generate(node) {
    if (!node) {
      return "";
    }
    if (Generators[node.name]) {
      puts("{{" + node.name + "}}");
      return Generators[node.name].call(generate, node);
    }
    if ((typeof name == "string" && name.test(/^[A-Z]+$/))) {
      return node.value;
    }
    return JSON.stringify(node);
  }

  Jack.generate = function (tree) {
    // puts(inspect(tree));
    return generate(tree);
  };

}());