(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      uses, scope, semi, need_return, comment, last_comment,
      Generators;

  Generators = {

    Block: function (node) {
      scope = Object.create(scope);
      var contents = node.value.map(function (item, index) {
        var inside;
        semi = true;
        last_comment = comment;
        comment = false;

        if (need_return && index === node.value.length - 1) {
          inside = "return " + render(item) + (semi ? ";" : "");
        } else {
          inside = render(item) + (semi ? ";" : "");
        }
        if (comment && !last_comment) {
          inside = "\n" + inside;
        }
        return inside;
      }).join("\n");
      var vars = Object.keys(scope);
      scope = scope.__proto__;
      if (vars.length > 0) {
        contents = "var " + vars.join(", ") + ";\n" + contents;
      }
      return contents;

    },

    If: function (node) {
      var content = "if (" + render(node.condition) + ") {" +
        block_indent(render(node.yes)) + "}";
      if (node.no) {
        content += " else { " +
          block_indent(render(node.no))
        + "}";
      }
      semi = false;
      return content;
    },

    Assign: function (node) {
      if (node.id.name == "ID") {
        if (!scope[node.id.value]) {
          scope[node.id.value] = true;
        }
      }

      return render(node.id) + " = " + render(node.value);
    },

    COMMENT: function (node) {
      semi = false;
      comment = true;
      return "//" + node.value;
    },

    BOOLEAN: function (node) {
      return node.value ? "true" : "false";
    },

    STRING: function (node) {
      return JSON.stringify(node.value);
    },

    List: function (node) {
      var list = "[" + node.value.map(render).join(", ") + "]";
      if (!node.parent) {
        return list;
      }
      uses["Object.spawn"] = true;
      return "Object.spawn(" + render(node.parent) + ", " + list + ")";
    },

    Object: function (node) {
      var obj = "{" + node.value.map(function (pair) {
        return render(pair[0]) + ": " + render(pair[1]);
      }).join(", ") + "}";
      if (!node.parent) {
        return obj;
      }
      uses["Object.spawn"] = true;
      return "Object.spawn(" + render(node.parent) + ", " + obj + ")";
    },

    Function: function (node) {
      // return JSON.stringify(node);
      var args = node.value[0],
          payload = node.value[1],
          use_block = payload.name === "Block";
      args = args.map(render).join(", ");

      if (use_block) {
        need_return = true;
        payload = block_indent(render(payload));
        need_return = false;
      } else {

        payload = "return " + render(payload) + ";";
        if (payload.length > 20) {
          payload = block_indent(payload);
        } else {
          payload = " " + payload + " ";
        }
      }
      return "function (" + args + ") {" + payload + "}";
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
        uses[node.type + ".interpolate"] = true;
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
    var code;
    uses = {};
    scope = {};
    code = render(tree);

    return Object.keys(uses).map(function (name) {
      return "// TODO: Implement " + name + "\n";
    }).join("") + code + "\n";
  };

}());