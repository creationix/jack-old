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

Object.new_inherited = function (parent, params, parent_name) {
  var o = Object.create(parent);
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      o[key] = params[key];
    }
  }
  o._parent_name_ = parent_name;
  return o;
};

// `parent` must have Array.prototype somewhere in it's chain
Array.new_inherited = function (parent, items, parent_name) {
  var o;
  o = Object.create(parent);
  items.forEach(function (item) {
    o.push(item);
  });
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

// var HtmlColors = {[] toHTML: function () {...} }
var HtmlColors = Object.new_inherited([], {
  toHTML: function () {
    return "[" + colored("332211", "HtmlColors") + " " + this.map(function (color) {
      return '<span style="color: ' + color + '">' + color + '</span>';
    }).join(", ") + "]";
  }
}, 'Array');

// var colors = [HtmlColors "#fe5410", "#0189ef", "#10ab01", "orange", "blue", "green" ]
var colors = Array.new_inherited(HtmlColors, ["#fe5410", "#0189ef", "#10ab01", "orange", "blue", "green"], "HtmlColors");
debug(colors.toHTML());

// debug(inspect(colors));