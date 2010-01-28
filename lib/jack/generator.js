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
      var items;
      if (!node.parent) {
        return "[" + node.value.map(render).join(", ") + "]";
      }
      items = node.value.map(function (value, index) {
        return index + ": {value: " + render(value) +
        ", enumerable: true}";
      });
      items.push("length: {value: " + node.value.length + ", enumerable: false}");
      return "Object.create(" + render(node.parent) + ", " +
        "{" + items.join(", ") + "})";

    },

    Object: function (node) {
      if (!node.parent) {
        return "{" + node.value.map(function (pair) {
          return render(pair[0]) + ": " + render(pair[1]);
        }).join(", ") + "}";
      }
      return "Object.create(" + render(node.parent) + ", " +
        "{" + node.value.map(function (pair) {
          return render(pair[0]) + ": {value: " + render(pair[1]) +
          ", enumerable: true}";
        }).join(", ") + "})";

    },

    Function: function (node) {
      var args = node.value[0],
          payload = node.value[1],
          use_block;
      if (args.length > 1) {
        payload = {
          name: node.name,
          value: [args.slice(1), payload]
        };
        args.length = 1;
        use_block = true;
      }
      args = args.map(function (set) {
        return set.map(render).join(", ");
      })

      payload = "return " + render(payload) + ";";
      if (use_block) {
        payload = block_indent(payload);
      } else {
        payload = " " + payload + " ";
      }
      return "function (" + args.join("") + ") {" + payload + "}";
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
        return node.type + ".interpolate(" + values.join(", ") + ")";
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

  function block_indent(code) {
    return "\n" + code.split("\n").map(function (line) {
      return "  " + line;
    }).join("\n") + "\n";
  }

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
    return render(tree);
  };

}());