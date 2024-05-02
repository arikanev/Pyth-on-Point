import assert from "node:assert/strict";
import optimize, { optimizers } from "../src/optimizer.js";
import * as core from "../src/core.js";

// Make some test cases easier to read
const x = core.variable("x", false, core.intType);
const loopBody = core.printStatement(x);

const tests = [
  ["folds +", core.binaryExpression("+", 5, 8), 13],
  ["folds -", core.binaryExpression("-", 5n, 8n), -3n],
  ["folds *", core.binaryExpression("*", 5, 8), 40],
  ["folds /", core.binaryExpression("/", 5, 8), 0.625],
  ["folds **", core.binaryExpression("**", 5, 8), 390625],
  ["folds <", core.binaryExpression("<", 5, 8), true],
  ["folds <=", core.binaryExpression("<=", 5, 8), true],
  ["folds ==", core.binaryExpression("==", 5, 8), false],
  ["folds !=", core.binaryExpression("!=", 5, 8), true],
  ["folds >=", core.binaryExpression(">=", 5, 8), false],
  ["folds >", core.binaryExpression(">", 5, 8), false],
  ["optimizes +0", core.binaryExpression("+", x, 0), x],
  ["optimizes -0", core.binaryExpression("-", x, 0), x],
  ["optimizes *1", core.binaryExpression("*", x, 1), x],
  ["optimizes /1", core.binaryExpression("/", x, 1), x],
  ["optimizes *0", core.binaryExpression("*", x, 0), 0],
  ["optimizes 0*", core.binaryExpression("*", 0, x), 0],
  ["optimizes 0/", core.binaryExpression("/", 0, x), 0],
  ["optimizes 0+", core.binaryExpression("+", 0, x), x],
  ["optimizes 1*", core.binaryExpression("*", 1, x), x],
  ["folds negation", core.unaryExpression("-", 8), -8],
  ["optimizes 1**", core.binaryExpression("**", 1, x), 1],
  ["optimizes **0", core.binaryExpression("**", x, 0), 1],
  [
    "optimizes predictive loop for prime numbers",
    core.predictiveLoop((x, 0, 11, "prime", loopBody)),
    [2, 3, 5, 7, 11],
  ],
];

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});

describe("The optimizer", () => {
  tests.forEach(([scenario, before, after]) => {
    it(scenario, () => {
      assert.deepEqual(optimize(before), after);
    });
  });
});

describe("PredictiveLoop Optimization", () => {
  it("should optimize a predictive loop", () => {
    const loop = core.predictiveLoop({
      iterator: core.variable("i", core.intType),
      low: core.numberLiteral(10, core.intType),
      high: core.numberLiteral(5, core.intType),
      patternType: "prime",
      body: [core.printStatement(core.variable("i", core.intType))],
    });
    const optimizedLoop = optimizers.PredictiveLoop(loop);
    // You need to define what the expected output should be here
    assert.deepEqual(optimizedLoop /* expected output */);
  });
});
