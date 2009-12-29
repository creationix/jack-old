process.mixin(require('sys'));

function colored(color, text) {
  return '<span style="color: #' + color + '">' + text + '</span>';
};

Function.prototype.toHTML = function () {
  return colored("888800", "[Function]");
};

Object.prototype.toHTML = function () {
  if (this.constructor === Array) {
    return Array.prototype.toHTML.call(this);
  }
  var pairs = [], klass;
  for (var key in this) {
    if (key !== "_parent_name_" && this.hasOwnProperty(key)) {
      pairs.push(colored("112277", key) + ': ' + this[key].toHTML());
    }
  }
  klass = this._parent_name_;
  return "{" + 
    (klass === undefined ? "" : colored("332211", klass)) +
    " " + pairs.join(", ") + " }";
};

Array.prototype.toHTML = function () {
  var pairs = this.map(function (item) {
    return item.toHTML();
  });
  klass = this._parent_name_;
  return "[" +
    (klass === undefined ? "" : colored("332211", klass)) +
    " " + pairs.join(", ") + " ]";
}

String.prototype.toHTML = function () {
  return colored("10ab01", JSON.stringify(this));
}

Number.prototype.toHTML = function () {
  return colored("1177aa", JSON.stringify(this));
}

Boolean.prototype.toHTML = function () {
  return colored("880055", JSON.stringify(this));
}

Object.create = function (o) {
  var F = function () {};
  F.prototype = o;
  return new F();
};

Object.new_inherited = function (parent, params, parent_name) {
  var o, F;
  F = function () {
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        this[key] = params[key];
      }
    }
  };
  F.prototype = parent;
  o = new F();
  o._parent_name_ = parent_name;
  return o;
};

Array.new_inherited = function (parent, items, parent_name) {
  var o, p, F;
  
  p = [];
  for (var key in parent) {
    p[key] = parent[key];
  }
  F = function () {
    var self = this;
    items.forEach(function (item) {
      self.push(item);
    });
  };
  F.prototype = p;
  o = new F();
  o._parent_name_ = parent_name;
  return o;
};

// Object with prototype
// var dog = { legs: 4, friendly: true }
var dog = { legs: 4, friendly: true };
// var pet = {dog name: "Fred" }
var pet = Object.new_inherited(dog, {name: "Fred" }, "dog");


debug(dog.toHTML());
debug(pet.toHTML());
// debug(inspect(dog));
// debug(inspect(pet));

var HtmlColors = {
  toHTML: function () {
    return "[" + colored("332211", "HtmlColors") + " " + this.map(function (color) {
      return '<span style="color: ' + color + '">' + color + '</span>';
    }).join(", ") + "]";
  }
};

// [HtmlColors "#fe5410", "#0189ef", "#10ab01", "orange", "blue", "green" ]
var colors = Array.new_inherited(HtmlColors, ["#fe5410", "#0189ef", "#10ab01", "orange", "blue", "green"], "HtmlColors");
debug(colors.toHTML());

// debug(inspect(colors));