# Jack - Making programming playful

Jack is a new language in development that gets translated to pure JavaScript and runs on top of nodeJS.

## Ideals

 - Be Simple! This is very important
 - Be fun! Otherwise, what's the point
 - Be productive! We can only really make time for this is something good comes out of it.

## Technical ideas

 - Compile cleanly down to JavaScript.
 - Use real prototypical inheritance, not the hacked version that made it into JavaScript.
 - Use real whitespace rules and get rid of those semicolons and braces.
 - Create a clean syntax for defining objects, functions, and blocks.  That should be all that's needed

## Sample syntax

    // require an external module
    var sys = require('sys')

    // Define a group of methods to be reused (like ruby modules)
    var friendly = object:
      greet(): sys.puts("{name} says hello")

    // Create a prototype object (kinda like a class)
    var tim = object:
      include friendly // Mixin in the friendly methods
      name: "Tim"
      age: 27
      family: "Caswell" 

    // Make another object based on the first (inheritance)
    var miranda = object (tim):
      name: "Miranda"
      age: 25

    // An object factory function (like a class constructor)
    var Person = function (name, age):
      object(tim):
        name: name
        age: age

    // Use the object factory  
    jack = Person("Jack", 3)

    // Test the objects
    tim.greet
    // Tim says hello
    miranda.greet
    // Miranda says hello
    jack.greet
    // Jack says hello
