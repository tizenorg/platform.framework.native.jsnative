'use strict';

// ES6 class reference
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes

var people_count = 0;

class Person {
  constructor(given, family) {
    this.given = given;
    this.family = family;
    people_count++;
  }

  // property getter
  get name() {
    return this.given + ', ' + this.family;
  }

  getGreetings() {
    return 'Hello, My name is '+ this.name;
  }

  static howManyPeople() {
    return people_count;
  }
};

module.exports = Person;

if (require.main === module) {
  // Test code
  var john = new Person('John', 'Peter');
  console.log(john.name);
  console.log(john.getGreetings());

  var park = new Person('John', 'Park');
  console.log(park.name);
  console.log(park.getGreetings());

  console.log('People count : ' + Person.howManyPeople());
}
