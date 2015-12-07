'use strict';

var Person = require('./how-to-make-class.js');

class Employee extends Person {
  constructor(given, family, company) {
    super(given, family);
    this.company = company;
  }

  // method override
  getGreetings() {
    var msg = super.getGreetings();
    msg += ' in ' + this.company;
    return msg;
  }

  getBonus() {
    return false;
  }
};

class President extends Employee {
  getBonus() {
    return true;
  }
};

module.exports = { 'Employee': Employee,
                   'President': President };

if (require.main === module) {
  // Test code
  var john = new Employee('John', 'Peter', 'Samsung');
  console.log(john.name);
  console.log(john.getGreetings());
  console.log('My bonus is ' + john.getBonus());

  var vp = new President('Mike', 'Park', 'Samsung');
  console.log(vp.name);
  console.log(vp.getGreetings());
  console.log('My bonus is ' + vp.getBonus());

  console.log('People count : ' + Person.howManyPeople());

}
