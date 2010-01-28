(function(){
  var compile, onChange, output, real_compile, setOutput, source, status, timer;
  source = null;
  output = null;
  status = null;
  setOutput = function setOutput(js) {
    // Remove the contents
    while (output.firstChild) {
      output.removeChild(output.firstChild);
    }
    // put in new contents
    return output.appendChild(document.createTextNode(js));
  };
  real_compile = function real_compile() {
    var code, js;
    code = source.value;
    try {
      js = Jack.compile(code);
      setOutput(js);
      sh_highlightDocument();
    } catch (e) {
      setOutput(e.stack);
    }
    return status.style.display = "none";
  };
  // Called
  compile = function compile() {
    status.style.display = "block";
    return setTimeout(real_compile, 0);
  };
  // Recompile after 500ms of idle time after any activity.
  timer = null;
  onChange = function onChange(e) {
    if (timer) {
      clearTimeout(timer);
    }
    return timer = setTimeout(compile, 500);
  };
  // Wait for the dom to be built before moving on.
  this.onload = function onload() {
    var sample;
    // Store references to our textareas.
    source = document.getElementById("source");
    output = document.getElementById("output");
    status = document.getElementById("status");
    // Load the sample code out of the script tag in the head.
    sample = document.getElementById("sample").innerHTML;
    sample = sample.substr(1, sample.length);
    // Fill in the box with the input and call compile
    source.value = sample;
    compile();
    source.focus();
    // Bind onkeyup and onchange in the text field
    source.addEventListener('keyup', onChange, false);
    return source.addEventListener('change', onChange, false);
  };
})();
