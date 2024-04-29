import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

// Make some test cases easier to read
const x = core.variable("x", false, core.intType);
const loopBody = core.printStatement(x);
const return1p1 = core.returnStatement(
  core.binaryExpression("+", 1, 1, core.intType)
);
const return2 = core.returnStatement(2);
const returnX = core.returnStatement(x);

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
