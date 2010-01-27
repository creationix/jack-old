process.mixin(require('sys'));

(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      Generators;

  Generators = {

    Block: function (node) {
      return node.value.map(render).join("\n");

    },

    BOOLEAN: function (node) {
      return node.value ? "true" : "false";
    },

    STRING: function (node) {
      return JSON.stringify(node.value);
    },

    List: function (node) {
      return "[" + node.value.map(render).join(", ") + "]";
    },

    Object: function (node) {
      return "{" + node.value.map(function (pair) {
        return render(pair[0]) + ": " + render(pair[1]);
      }).join(", ") + "}";
    },

    INTERPOL: function (node) {
      var raw = false, values;
      values = node.value.map(function (item) {
        if (raw = !raw) {
          return JSON.stringify(item);
        }
        // TODO: Do a Jack compile here.
        return item;
      })
      if (node.type) {
        return node.type + ".interpolate([" + values.join(", ") + "])";
      }
      values = values.filter(function (item) {
        return item !== '""';
      });
      if (values.length === 0) {
        return '""';
      }
      if (values.length === 1) {
        return values[0];
      }
      return "(" + values.join(" + ") + ")";
    }

  };

  function render(node) {
    if (!node) {
      return "";
    }
    if (Generators[node.name]) {
      return Generators[node.name](node);
    }
    if ((typeof node.name == "string" && node.name.match(/^[A-Z]+$/))) {
      return node.value;
    }
    return JSON.stringify(node);
  }

  Jack.generate = function (tree) {
    // puts(inspect(tree));
    return render(tree);
  };

}());