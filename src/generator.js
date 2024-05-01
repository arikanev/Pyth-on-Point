// generator.js

import * as core from "./core.js";

function generateExpression(expr) {
  switch (expr.kind) {
    case "BooleanLiteral":
      return expr.value ? "true" : "false";
    case "NumberLiteral":
      return expr.value.toString();
    case "StringLiteral":
      return `"${expr.value}"`;
    case "Variable":
      return expr.name;
    case "BinaryExpression":
      return `(${generateExpression(expr.left)} ${expr.op} ${generateExpression(
        expr.right
      )})`;
    case "CallExpression":
      const args = expr.args.map(generateExpression).join(", ");
      return `${expr.callee.name}(${args})`;
    // Add more cases for other expression types as needed
    default:
      throw new Error(`Unhandled expression type: ${expr.kind}`);
  }
}

function generateStatement(stmt) {
  switch (stmt.kind) {
    case "VariableDeclaration":
      return `let ${stmt.variable.name} = ${generateExpression(
        stmt.initializer
      )};`;
    case "VariableReassignment":
      return `${stmt.variable.name} = ${generateExpression(stmt.value)};`;
    case "PrintStatement":
      return `console.log(${generateExpression(stmt.expression)});`;
    case "ReturnStatement":
      return `return ${generateExpression(stmt.expression)};`;
    case "YieldStatement":
      return `yield ${generateExpression(stmt.expression)};`;
    case "ComparisonStatement":
      return `${generateExpression(stmt.expression1)} === ${generateExpression(
        stmt.expression2
      )}`;
    case "PredictiveLoop":
      const { iterator, low, high, patternType, body } = stmt;
      const lowCode = generateExpression(low);
      const highCode = generateExpression(high);
      const bodyCode = body.map(generateStatement).join("\n");
      return `for (let ${iterator.name} = ${lowCode}; ${iterator.name} <= ${highCode}; ${iterator.name}++) {\n${bodyCode}\n}`;
    // Add more cases for other statement types as needed
    default:
      throw new Error(`Unhandled statement type: ${stmt.kind}`);
  }
}

function generateFunction(fun) {
  const { name, paramNames, body } = fun;
  const params = paramNames.map((param) => param.paramName).join(", ");
  const bodyCode = body.map(generateStatement).join("\n");
  return `function ${name}(${params}) {\n${bodyCode}\n}`;
}

export function generateCode(intermediateRepresentation) {
  const { statements } = intermediateRepresentation;
  const code = statements
    .map((stmt) => {
      switch (stmt.kind) {
        case "FunctionDeclaration":
          return generateFunction(stmt.fun);
        case "NaturalLanguageFunctionDefinition":
          return generateFunction(stmt);
        default:
          return generateStatement(stmt);
      }
    })
    .join("\n\n");
  return code;
}

export default {
  generateCode,
};
