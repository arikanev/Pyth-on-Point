import assert from "node:assert/strict";
import parse from "../src/parser.js"; // Assuming you have a parsing mechanism
import sinon from "sinon";
import analyze, {
  typeDescription,
  mustBeAssignable,
  equivalent,
} from "../src/analyzer.js";
import {
  program,
  naturalLanguageFunctionDefinition,
  variable,
  printStatement,
  binaryExpression,
  stringLiteral,
  predictiveLoop,
  comparisonStatement,
  boolType,
  intType,
  floatType,
  stringType,
  voidType,
  anyType,
} from "../src/core.js";

// Semantic checks for PythOnPoint language
const semanticChecks = [
  ["print statements", 'print "Hello PythOnPoint!"'],
  [
    "one liner function definition",
    'define greet(name) then print "Hello " + name',
  ],
  ["predictive loop", "for x in predictive_range(1, 10, prime) { print(x) }"],
  ["comparison statement", "compare 1 to 2"],
  [
    "variable declaration and usage",
    `let x = 5
     print x`,
  ],
  [
    "binary expression",
    `let result = 2 + 3
     print result`,
  ],
  [
    "function call",
    `define greet(name) then print "Hello " + name
     greet(name="Alice")`,
  ],
  [
    "nested function definition",
    `define outer() then
       define inner() then
         print "Inside inner"
       inner()
     outer()`,
  ],
  [
    "return statement",
    `define square(x) then
       return x * x
     print square(5)`,
  ],
  [
    "yield statement",
    `define countPrime() then
       for i in predictive_range(0, 10, prime) {
        yield i
       } `,
  ],
  [
    "comparison with variables",
    `let x = 10
     let y = 20
     compare x to y`,
  ],
  [
    "multiple variable declarations",
    `let x = 5
     let y = 10
     let z = x + y
     print z`,
  ],
  [
    "function with multiple parameters",
    `define add(a, b) then
       return a + b
     print add(3, 7)`,
  ],
  [
    "nested predictive loops",
    `for i in predictive_range(1, 5, prime) {
       for j in predictive_range(1, 3, fibonacci) {
         print i * j
       }
      }`,
  ],
  [
    "complex binary expressions",
    `let x = (10 + 5) * 3 - 8 / 2
     print x`,
  ],
  [
    "recursive function call",
    `define recurse(n) then 
         n = 2
         return recurse(n)`,
  ],
  [
    "predictive loop with complex range",
    `for i in predictive_range(1, 10, factorial) {
       print i
    }`,
  ],
  [
    "logical operators",
    `let x = true
     let y = false
     let z = x and y
     print z`,
  ],
  [
    "short-circuiting logical operators",
    `define isDivisibleBy(n, d) then
       return n % d == 0
     let x = 10
     if isDivisibleBy(x, 2) or isDivisibleBy(x, 3) then
       print "Divisible by 2 or 3"
     else
       print "Not divisible by 2 or 3"`,
  ],
  [
    "nested comparison statements",
    `let x = 5
     let y = 10
     let z = 7
     compare x to y
     compare y to z`,
  ],
  [
    "optional parameters",
    `define greet(name, greeting = "Hello") then
       print greeting + ", " + name
     greet("Alice")
     greet("Bob", "Hi")`,
  ],
  [
    "default parameter values",
    `define multiply(a, b = 2) then
       return a * b
     print multiply(5)
     print multiply(5, 3)`,
  ],
  [
    "print statement with variable",
    `let message = "Hello, PythOnPoint!"
     print message`,
  ],
  [
    "print statement with binary expression",
    `let x = 5
     let y = 3
     print "Result: " + (x + y)`,
  ],
  [
    "predictive loop with different pattern",
    `for i in predictive_range(1, 20, fibonacci) {
       print i
    }`,
  ],
  [
    "predictive loop with variable bounds",
    `let start = 1
     let end = 10
     for i in predictive_range(start, end, prime) {
       print i
     }`,
  ],
  ["comparison statement with literals", `compare 5 to 10`],
  [
    "comparison statement with complex expressions",
    `let x = 5
     let y = 3
     compare (x * 2) to (y * 3)`,
  ],
  [
    "variable declaration with literal",
    `let x = 10
     print x`,
  ],
  [
    "variable declaration with binary expression",
    `let x = 5 + 3
     print x`,
  ],
  [
    "binary expression with variables",
    `let x = 5
     let y = 3
     let result = x * y
     print result`,
  ],
  [
    "binary expression with function call",
    `define square(n) then
       return n * n
     let x = 5
     let result = square(x) + 1
     print result`,
  ],
  [
    "comparison with variables and literals",
    `let x = 5
     compare x to 10`,
  ],
  [
    "multiple variable declarations with binary expressions",
    `let x = 5
     let y = 3
     let sum = x + y
     let product = x * y
     print sum
     print product`,
  ],
  [
    "nested comparison statements with variables",
    `let x = 5
     let y = 10
     let z = 7
     compare x to y
     compare y to z
     compare x to z`,
  ],
];
// Add more checks as needed for your language features

// Programs with expected semantic errors
const semanticErrors = [
  ["undeclared variable in print", "print x", /Identifier x not declared/],
  [
    "misused natural language keyword",
    "define greet(name) then print nombre",
    /Identifier nombre not declared/,
  ],
  [
    "invalid binary expression operands",
    `let result = 2 + "hello"`,
    /Expected a number/,
  ],
  [
    "redeclared variable",
    `let x = 1
     let x = 2`,
    /Identifier x already declared/,
  ],
  [
    "undefined function call",
    `greet("Alice")`,
    /Identifier greet not declared/,
  ],
  [
    "wrong number of arguments",
    `define greet(name) then print "Hello " + name
     greet()`,
    /1 argument\(s\) required but 0 passed/,
  ],
  [
    "invalid argument type",
    `define square(x) then return x * x
     square("5")`,
    /Cannot assign a string to a int/,
  ],
  [
    "return outside function",
    `let x = 5
     return x`,
    /Return can only appear in a function/,
  ],
  [
    "yield outside loop",
    `define generateNumber() then
       yield 42
     generateNumber()`,
    /Yield can only appear in a loop/,
  ],
  [
    "invalid operands for comparison",
    `compare 1 to true`,
    /Operands do not have the same type/,
  ],
  [
    "multiple variable declarations",
    `let x = 5
     let y = 10
     let z = x + y
     print z`,
  ],
  [
    "function with multiple parameters",
    `define add(a, b) then
       return a + b
     print add(3, 7)`,
  ],
  [
    "nested predictive loops",
    `for i in predictive_range(1, 5, prime) then
       for j in predictive_range(1, 3, fibonacci) then
         print i * j`,
  ],
  [
    "complex binary expressions",
    `let x = (10 + 5) * 3 - 8 / 2
     print x`,
  ],
  [
    "function with conditional return",
    `define isEven(n) then
       if n % 2 == 0 then
         return true
       else
         return false
     print isEven(4)`,
  ],
  [
    "recursive function call",
    `define factorial(n) then
       if n == 0 then
         return 1
       else
         return n * factorial(n - 1)
     print factorial(5)`,
  ],
  [
    "higher-order function",
    `define applyTwice(func, x) then
       return func(func(x))
     define square(x) then
       return x * x
     print applyTwice(square, 3)`,
  ],
  [
    "closure",
    `define outerFunction() then
       let counter = 0
       define innerFunction() then
         counter = counter + 1
         print counter
       return innerFunction
     let increment = outerFunction()
     increment()
     increment()`,
  ],
  [
    "predictive loop with complex range",
    `for i in predictive_range(1 + 2, 10 * 2, prime) then
       print i`,
  ],
  [
    "logical operators",
    `let x = true
     let y = false
     let z = x and y
     print z`,
  ],
  [
    "short-circuiting logical operators",
    `define isDivisibleBy(n, d) then
       return n % d == 0
     let x = 10
     if isDivisibleBy(x, 2) or isDivisibleBy(x, 3) then
       print "Divisible by 2 or 3"
     else
       print "Not divisible by 2 or 3"`,
  ],
  [
    "nested comparison statements",
    `let x = 5
     let y = 10
     let z = 7
     compare x to y
     compare y to z`,
  ],
  [
    "optional parameters",
    `define greet(name, greeting = "Hello") then
       print greeting + ", " + name
     greet("Alice")
     greet("Bob", "Hi")`,
  ],
  [
    "default parameter values",
    `define multiply(a, b = 2) then
       return a * b
     print multiply(5)
     print multiply(5, 3)`,
  ],
  [
    "predictive loop with no pattern",
    `for i in predictive_range(1, 5) then
       print i`,
  ],
  [
    "undeclared variable in binary expression",
    `let result = x + 5`,
    /Identifier x not declared/,
  ],
  [
    "misused natural language keyword in function body",
    `define greet(name) then
       print "Hello, " + nombre`,
    /Identifier nombre not declared/,
  ],
  [
    "invalid binary expression operands with variables",
    `let x = 5
     let y = "hello"
     let result = x + y`,
    /Expected a number/,
  ],
  [
    "redeclared variable in function",
    `define test() then
       let x = 5
       let x = 10`,
    /Identifier x already declared/,
  ],
  [
    "undefined function call in binary expression",
    `let result = square(5) + 1`,
    /Identifier square not declared/,
  ],
  [
    "complex binary expression with invalid operands",
    `let x = 5
     let y = "hello"
     let result = (x * 2) + (y / 3)`,
    /Expected a number/,
  ],
  [
    "logical operators with invalid operands",
    `let x = 5
     let y = "hello"
     let result = x and y`,
    /Expected a boolean/,
  ],
];
// Add more error checks as needed for your language features

describe("The analyzer for PythOnPoint", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`correctly analyzes ${scenario}`, () => {
      // Assuming `parse` returns an AST directly suitable for analysis in this example
      const ast = parse(source); // Implement parse function based on your setup
      assert.doesNotThrow(() => analyze(ast));
    });
  }

  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`detects error for ${scenario}`, () => {
      const ast = parse(source); // Implement parse function based on your setup
      assert.throws(() => analyze(ast), errorMessagePattern);
    });
  }
});

describe("typeDescription", () => {
  it("returns 'int' for IntType", () => {
    const type = { kind: "IntType" };
    assert.strictEqual(typeDescription(type), "int");
  });

  it("returns 'float' for FloatType", () => {
    const type = { kind: "FloatType" };
    assert.strictEqual(typeDescription(type), "float");
  });

  it("returns 'string' for StringType", () => {
    const type = { kind: "StringType" };
    assert.strictEqual(typeDescription(type), "string");
  });

  it("returns 'boolean' for BoolType", () => {
    const type = { kind: "BoolType" };
    assert.strictEqual(typeDescription(type), "boolean");
  });

  it("returns 'void' for VoidType", () => {
    const type = { kind: "VoidType" };
    assert.strictEqual(typeDescription(type), "void");
  });

  it("returns 'any' for AnyType", () => {
    const type = { kind: "AnyType" };
    assert.strictEqual(typeDescription(type), "any");
  });

  it("returns the struct name for StructType", () => {
    const type = { kind: "StructType", name: "Point" };
    assert.strictEqual(typeDescription(type), "Point");
  });

  it("returns the function type description for FunctionType", () => {
    const type = {
      kind: "FunctionType",
      paramTypes: [{ kind: "IntType" }, { kind: "StringType" }],
      returnType: { kind: "BoolType" },
    };
    assert.strictEqual(typeDescription(type), "(int, string)->boolean");
  });

  it("returns the array type description for ArrayType", () => {
    const type = {
      kind: "ArrayType",
      baseType: { kind: "IntType" },
    };
    assert.strictEqual(typeDescription(type), "[int]");
  });

  it("returns the optional type description for OptionalType", () => {
    const type = {
      kind: "OptionalType",
      baseType: { kind: "StringType" },
    };
    assert.strictEqual(typeDescription(type), "string?");
  });
});

describe("mustBeAssignable", () => {
  it("does not throw an error when the types are assignable", () => {
    const e = { type: intType };
    const type = intType;
    const at = { location: "test" };
    assert.doesNotThrow(() => mustBeAssignable(e, { toType: type }, at));
  });

  it("throws an error when the types are not assignable", () => {
    const e = { type: intType };
    const type = boolType;
    const at = { location: "test" };
    assert.throws(
      () => mustBeAssignable(e, { toType: type }, at),
      /Cannot assign a int to a boolean/
    );
  });

  it("includes the correct type descriptions in the error message", () => {
    const e = { type: { kind: "ArrayType", baseType: stringType } };
    const type = { kind: "OptionalType", baseType: intType };
    const at = { location: "test" };
    assert.throws(
      () => mustBeAssignable(e, { toType: type }, at),
      /Cannot assign a \[string\] to a int\?/
    );
  });

  it("calls the 'must' function with the correct arguments", () => {
    const e = { type: intType };
    const type = intType;
    const at = { location: "test" };
    const mustStub = sinon.stub();
    const originalMust = must;
    must = mustStub;
    mustBeAssignable(e, { toType: type }, at);
    assert.strictEqual(mustStub.callCount, 1);
    assert.strictEqual(mustStub.args[0][0], true);
    assert.strictEqual(mustStub.args[0][1], "Cannot assign a int to a int");
    assert.strictEqual(mustStub.args[0][2], at);
    must = originalMust;
  });
});

describe("equivalent", () => {
  it("returns true when the types are identical", () => {
    const t1 = intType;
    const t2 = intType;
    assert.strictEqual(equivalent(t1, t2), true);
  });

  it("returns true when both types are OptionalType and their base types are equivalent", () => {
    const t1 = { kind: "OptionalType", baseType: intType };
    const t2 = { kind: "OptionalType", baseType: intType };
    assert.strictEqual(equivalent(t1, t2), true);
  });

  it("returns false when both types are OptionalType but their base types are not equivalent", () => {
    const t1 = { kind: "OptionalType", baseType: intType };
    const t2 = { kind: "OptionalType", baseType: stringType };
    assert.strictEqual(equivalent(t1, t2), false);
  });

  it("returns true when both types are ArrayType and their base types are equivalent", () => {
    const t1 = { kind: "ArrayType", baseType: intType };
    const t2 = { kind: "ArrayType", baseType: intType };
    assert.strictEqual(equivalent(t1, t2), true);
  });

  it("returns false when both types are ArrayType but their base types are not equivalent", () => {
    const t1 = { kind: "ArrayType", baseType: intType };
    const t2 = { kind: "ArrayType", baseType: stringType };
    assert.strictEqual(equivalent(t1, t2), false);
  });

  it("returns true when both types are FunctionType, have equivalent return types, and have equivalent parameter types", () => {
    const t1 = {
      kind: "FunctionType",
      returnType: intType,
      paramTypes: [intType, stringType],
    };
    const t2 = {
      kind: "FunctionType",
      returnType: intType,
      paramTypes: [intType, stringType],
    };
    assert.strictEqual(equivalent(t1, t2), true);
  });

  it("returns false when both types are FunctionType but have different return types", () => {
    const t1 = {
      kind: "FunctionType",
      returnType: intType,
      paramTypes: [intType, stringType],
    };
    const t2 = {
      kind: "FunctionType",
      returnType: boolType,
      paramTypes: [intType, stringType],
    };
    assert.strictEqual(equivalent(t1, t2), false);
  });

  it("returns false when both types are FunctionType but have different parameter types", () => {
    const t1 = {
      kind: "FunctionType",
      returnType: intType,
      paramTypes: [intType, stringType],
    };
    const t2 = {
      kind: "FunctionType",
      returnType: intType,
      paramTypes: [boolType, stringType],
    };
    assert.strictEqual(equivalent(t1, t2), false);
  });

  it("returns false when the types are different", () => {
    const t1 = intType;
    const t2 = stringType;
    assert.strictEqual(equivalent(t1, t2), false);
  });
});

describe("_iter", () => {
  let builder;

  before(() => {
    // Setup builder by calling analyze with appropriate mock input
    const mockInput = {
      matcher: {
        grammar: {
          createSemantics: () => ({
            addOperation: (name, operations) => operations,
          }),
        },
      },
    };
    builder = analyze(mockInput).builder;
  });

  it("returns an empty array when no children are passed", () => {
    const result = builder._iter();
    assert.deepStrictEqual(result, []);
  });

  it("returns an array with the representation of a single child", () => {
    const child = { rep: sinon.stub().returns("child1") };
    const result = builder._iter(child);
    assert.deepStrictEqual(result, ["child1"]);
    assert.strictEqual(child.rep.callCount, 1); // Ensure rep was called
  });

  it("returns an array with the representations of multiple children", () => {
    const child1 = { rep: sinon.stub().returns("child1") };
    const child2 = { rep: sinon.stub().returns("child2") };
    const child3 = { rep: sinon.stub().returns("child3") };
    const result = builder._iter(child1, child2, child3);
    assert.deepStrictEqual(result, ["child1", "child2", "child3"]);
    assert.strictEqual(child1.rep.callCount, 1);
    assert.strictEqual(child2.rep.callCount, 1);
    assert.strictEqual(child3.rep.callCount, 1);
  });

  it("handles children with missing rep function", () => {
    const child1 = { rep: sinon.stub().returns("child1") };
    const child2 = {}; // Missing rep function
    const child3 = { rep: sinon.stub().returns("child3") };
    const result = builder._iter(child1, child2, child3);
    assert.deepStrictEqual(result, ["child1", undefined, "child3"]);
    assert.strictEqual(child1.rep.callCount, 1);
    assert.strictEqual(child3.rep.callCount, 1);
  });
});

describe("functionName", () => {
  it("returns the source string of the provided name", () => {
    const name = { sourceString: "myFunction" };
    const result = analyze.builder.functionName(name);
    assert.strictEqual(result, "myFunction");
  });

  it("returns undefined when the name is not provided", () => {
    const result = analyze.builder.functionName();
    assert.strictEqual(result, undefined);
  });

  it("returns undefined when the name does not have a sourceString property", () => {
    const name = {};
    const result = analyze.builder.functionName(name);
    assert.strictEqual(result, undefined);
  });
});

describe("Expression_true", () => {
  it("returns a boolean literal with value true", () => {
    const _true = { sourceString: "true" };
    const result = analyze.builder.Expression_true(_true);
    console.log(result);
    console.log(core.booleanLiteral(true));
    assert.deepStrictEqual(result, core.booleanLiteral(true));
  });
});

describe("Expression_binary_logical", () => {
  it("returns a binary expression with boolean type for 'and' operator", () => {
    const expression = { rep: sinon.stub().returns({ type: boolType }) };
    const expression2 = { rep: sinon.stub().returns({ type: boolType }) };
    const op = { sourceString: "and" };
    const result = analyze.builder.Expression_binary_logical(
      expression,
      op,
      expression2
    );
    assert.deepStrictEqual(
      result,
      core.binaryExpression(
        "and",
        { type: boolType },
        { type: boolType },
        boolType
      )
    );
    assert.strictEqual(expression.rep.callCount, 1);
    assert.strictEqual(expression2.rep.callCount, 1);
  });

  it("returns a binary expression with boolean type for 'or' operator", () => {
    const expression = { rep: sinon.stub().returns({ type: boolType }) };
    const expression2 = { rep: sinon.stub().returns({ type: boolType }) };
    const op = { sourceString: "or" };
    const result = analyze.builder.Expression_binary_logical(
      expression,
      op,
      expression2
    );
    assert.deepStrictEqual(
      result,
      core.binaryExpression(
        "or",
        { type: boolType },
        { type: boolType },
        boolType
      )
    );
    assert.strictEqual(expression.rep.callCount, 1);
    assert.strictEqual(expression2.rep.callCount, 1);
  });

  it("throws an error for an invalid logical operator", () => {
    const expression = { rep: sinon.stub().returns({ type: boolType }) };
    const expression2 = { rep: sinon.stub().returns({ type: boolType }) };
    const op = { sourceString: "invalidOperator" };
    assert.throws(
      () =>
        analyze.builder.Expression_binary_logical(expression, op, expression2),
      /Invalid logical operator: invalidOperator/
    );
    assert.strictEqual(expression.rep.callCount, 1);
    assert.strictEqual(expression2.rep.callCount, 1);
  });

  it("calls mustHaveBooleanType for the left operand", () => {
    const expression = { rep: sinon.stub().returns({ type: intType }), at: {} };
    const expression2 = { rep: sinon.stub().returns({ type: boolType }) };
    const op = { sourceString: "and" };
    const mustHaveBooleanTypeStub = sinon.stub(analyze, "mustHaveBooleanType");
    assert.throws(
      () =>
        analyze.builder.Expression_binary_logical(expression, op, expression2),
      /Expected a boolean/
    );
    assert.strictEqual(mustHaveBooleanTypeStub.callCount, 1);
    assert.strictEqual(mustHaveBooleanTypeStub.args[0][0], { type: intType });
    assert.strictEqual(mustHaveBooleanTypeStub.args[0][1].at, expression);
    mustHaveBooleanTypeStub.restore();
  });

  it("calls mustHaveBooleanType for the right operand", () => {
    const expression = { rep: sinon.stub().returns({ type: boolType }) };
    const expression2 = {
      rep: sinon.stub().returns({ type: intType }),
      at: {},
    };
    const op = { sourceString: "and" };
    const mustHaveBooleanTypeStub = sinon.stub(analyze, "mustHaveBooleanType");
    assert.throws(
      () =>
        analyze.builder.Expression_binary_logical(expression, op, expression2),
      /Expected a boolean/
    );
    assert.strictEqual(mustHaveBooleanTypeStub.callCount, 2);
    assert.strictEqual(mustHaveBooleanTypeStub.args[1][0], { type: intType });
    assert.strictEqual(mustHaveBooleanTypeStub.args[1][1].at, expression2);
    mustHaveBooleanTypeStub.restore();
  });
});
