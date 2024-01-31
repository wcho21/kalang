import type * as Node from "../parser/v2";
import type * as Value from "./value";
import * as value from "./value";
import Environment from "./environment/v2";
import type { Range } from "../util/position";

class EvalError extends Error {
  public range: Range;

  constructor(range: Range) {
    super();
    this.range = range;
  }
}

class TopLevelReturnError extends EvalError {};
class BadPredicateError extends EvalError {};
class BadAssignmentLeftError extends EvalError {};
class BadPrefixExpressionError extends EvalError {};
class BadInfixExpressionError extends EvalError {};
class BadIdentifierError extends EvalError {};

type ComparisonOperator = "==" | "!=" | ">" | "<" | ">=" | "<=";

export default class Evaluator {
  evaluate(node: Node.ProgramNode, env: Environment): Value.Value {
    return this.evaluateProgram(node, env);
  }

  private evaluateProgram(node: Node.ProgramNode, env: Environment): Value.Value {
    const { statements } = node;

    let lastEvaluated: Value.Value | null = null;
    for (let i = 0; i < statements.length; ++i) {
      const evaluated = this.evaluateStatement(statements[i], env);

      if (evaluated.type === "return") {
        throw new TopLevelReturnError(node.range);
      }

      lastEvaluated = evaluated;
    }

    return lastEvaluated ?? this.createEmptyValue(node.range);
  }

  private evaluateStatement(node: Node.StatementNode, env: Environment): Value.Value | Value.ReturnValue {
    if (node.type === "branch") {
      return this.evaluateBranchStatement(node, env);
    }
    if (node.type === "expression statement") {
      return this.evaluateExpressionStatement(node, env);
    }
    if (node.type === "return") {
      const val = this.evaluateExpression(node.expression, env);
      return value.createReturnValue(val);
    }

    const nothing: never = node;
    return nothing;
  }

  private evaluateBranchStatement(node: Node.BranchNode, env: Environment): Value.Value | Value.ReturnValue {
    const pred = this.evaluateExpression(node.predicate, env);
    if (pred.type !== "boolean") {
      throw new BadPredicateError(node.range);
    }

    if (pred.value) {
      return this.evaluateBlock(node.consequence, env);
    }

    if (node.alternative === undefined) {
      return this.createEmptyValue(node.range);
    }

    return this.evaluateBlock(node.alternative, env);
  }

  private evaluateBlock(node: Node.BlockNode, env: Environment): Value.Value | Value.ReturnValue {
    let lastEvaluated: Value.Value | null = null;

    for (let i = 0; i < node.statements.length; ++i) {
      const evaluated = this.evaluateStatement(node.statements[i], env);

      if (evaluated.type === "return") {
        return evaluated;
      }

      lastEvaluated = evaluated;
    }

    return lastEvaluated ?? this.createEmptyValue(node.range);
  }

  private evaluateExpressionStatement(node: Node.ExpressionStatementNode, env: Environment): Value.Value {
    return this.evaluateExpression(node.expression, env);
  }

  private evaluateExpression(node: Node.ExpressionNode, env: Environment): Value.Value {
    if (node.type === "number") {
      return this.createNumberValue(node.value, node.range);
    }
    if (node.type === "boolean") {
      return this.createBooleanValue(node.value, node.range);
    }
    if (node.type === "string") {
      return this.createStringValue(node.value, node.range);
    }
    if (node.type === "prefix") {
      return this.evaluatePrefixExpression(node, env);
    }
    if (node.type === "infix") {
      return this.evaluateInfixExpression(node, env);
    }
    if (node.type === "assignment") {
      return this.evaluateAssignment(node, env);
    }
    if (node.type === "identifier") {
      return this.evaluateIdentifier(node, env);
    }
    if (node.type === "function") {
      return this.evaluateFunctionExpression(node, env);
    }
    if (node.type === "call") {
      return this.evaluateCall(node, env);
    }

    const _never: never = node;
    return _never;
  }

  private evaluatePrefixExpression(node: Node.PrefixNode, env: Environment): Value.Value {
    const right = this.evaluateExpression(node.right, env);

    if ((node.prefix === "+" || node.prefix === "-") && right.type == "number") {
      return this.evaluatePrefixNumberExpression(node.prefix, right);
    }
    if (node.prefix === "!" && right.type === "boolean") {
      return this.evaluatePrefixBooleanExpression(node.prefix, right);
    }

    throw new BadPrefixExpressionError(node.range);
  }

  private evaluateInfixExpression(node: Node.InfixNode, env: Environment): Value.Value {
    const left = this.evaluateExpression(node.left, env);
    const right = this.evaluateExpression(node.right, env);

    if (left.type === "number" && right.type === "number" && this.isArithmeticInfixOperator(node.infix)) {
      const value = this.getArithmeticInfixOperationValue(left.value, right.value, node.infix);
      return this.createNumberValue(value, node.range);
    }

    if (left.type === "number" && right.type === "number" && this.isComparisonInfixOperator(node.infix)) {
      const value = this.getNumericComparisonInfixOperationValue(left.value, right.value, node.infix);
      return this.createBooleanValue(value, node.range);
    }

    if (left.type === "boolean" && right.type === "boolean" && this.isComparisonInfixOperator(node.infix)) {
      const value = this.getBooleanComparisonInfixOperationValue(left.value, right.value, node.infix);
      return this.createBooleanValue(value, node.range);
    }

    if (left.type === "string" && right.type === "string" && this.isComparisonInfixOperator(node.infix)) {
      const value = this.getStringComparisonInfixOperationValue(left.value, right.value, node.infix);
      return this.createBooleanValue(value, node.range);
    }

    throw new BadInfixExpressionError(node.range);
  }

  private evaluateIdentifier(node: Node.IdentifierNode, env: Environment): Value.Value {
    const varName = node.value;
    const value = env.get(varName);

    if (value === null) {
      throw new BadIdentifierError(node.range);
    }

    return value;
  }

  private evaluateAssignment(node: Node.AssignmentNode, env: Environment): Value.Value {
    if (node.left.type !== "identifier") {
      throw new BadAssignmentLeftError(node.range);
    }

    const varName = node.left.value;
    const varValue = this.evaluateExpression(node.right, env);

    env.set(varName, varValue);

    return varValue; // evaluated value of assignment is the evaluated value of variable
  }

  private evaluateFunctionExpression(node: Node.FunctionNode, env: Environment): Value.Value {
    return this.createFunctionValue(node.parameters, node.body, env, node.range);
  }

  private evaluateCall(node: Node.CallNode, env: Environment): Value.Value {
    const func = this.evaluateExpression(node.func, env);
    if (func.type !== "function") {
      throw new Error(`expected function but received ${func.type}`);
    }

    const callArguments = this.evaluateCallArguments(node.args, env);

    const value = this.evaluateFunctionCall(func, callArguments);
    return value;
  }

  private evaluateCallArguments(args: Node.ExpressionNode[], env: Environment): Value.Value[] {
    return args.map(arg => this.evaluateExpression(arg, env));
  }

  private evaluateFunctionCall(func: Value.FunctionValue, callArguments: Value.Value[]): Value.Value {
    const env = this.createExtendedEnvironment(func.environment, func.parameters, callArguments);

    const blockValue = this.evaluateBlock(func.body, env);
    if (blockValue.type !== "return") {
      // TODO: better error with range
      throw new Error(`expected return value in function but it didn't`);
    }

    const returnValue = blockValue.value;
    return returnValue;
  }

  private getBooleanComparisonInfixOperationValue(left: boolean, right: boolean, operator: ComparisonOperator): boolean {
    return this.getComparisonInfixOperationValue<boolean>(left, right, operator);
  }

  private getNumericComparisonInfixOperationValue(left: number, right: number, operator: ComparisonOperator): boolean {
    return this.getComparisonInfixOperationValue<number>(left, right, operator);
  }

  private getStringComparisonInfixOperationValue(left: string, right: string, operator: ComparisonOperator): boolean {
    return this.getComparisonInfixOperationValue<string>(left, right, operator);
  }

  private getComparisonInfixOperationValue<T>(left: T, right: T, operator: ComparisonOperator): boolean {
    if (operator === "==") {
      return left === right;
    }
    if (operator === "!=") {
      return left !== right;
    }
    if (operator === ">") {
      return left > right;
    }
    if (operator === "<") {
      return left < right;
    }
    if (operator === ">=") {
      return left >= right;
    }
    if (operator === "<=") {
      return left <= right;
    }

    const _never: never = operator;
    return _never;
  }

  private getArithmeticInfixOperationValue(left: number, right: number, operator: "+" | "-" | "*" | "/"): number {
    if (operator === "+") {
      return left + right;
    }
    if (operator === "-") {
      return left - right;
    }
    if (operator === "*") {
      return left * right;
    }
    if (operator === "/") {
      return left / right;
    }

    const _never: never = operator;
    return _never;
  }

  private evaluatePrefixNumberExpression(prefix: "+" | "-", node: Node.NumberNode): Value.NumberValue {
    if (prefix === "+") {
      return this.createNumberValue(node.value, node.range);
    }
    if (prefix === "-") {
      return this.createNumberValue(-node.value, node.range);
    }

    const _never: never = prefix;
    return _never;
  }

  private evaluatePrefixBooleanExpression(prefix: "!", node: Node.BooleanNode): Value.BooleanValue {
    if (prefix === "!") {
      return this.createBooleanValue(!node.value, node.range);
    }

    const _never: never = prefix;
    return _never;
  }

  private createExtendedEnvironment(oldEnv: Environment, identifiers: Node.IdentifierNode[], values: Value.Value[]): Environment {
    const newEnv = new Environment(oldEnv);

    for (let i = 0; i < identifiers.length; ++i) {
      const name = identifiers[i].value;
      const value = values[i];
      newEnv.set(name, value);
    }

    return newEnv;
  }

  // create value functions: wrappers for consistent representation

  private createNumberValue(val: number, range: Range): Value.NumberValue {
    return value.createNumberValue({ value: val }, String(value), range);
  }

  private createBooleanValue(val: boolean, range: Range): Value.BooleanValue {
    return value.createBooleanValue({ value: val }, value ? "참" : "거짓", range);
  }

  private createStringValue(val: string, range: Range): Value.StringValue {
    return value.createStringValue({ value: val }, val, range);
  }

  private createEmptyValue(range: Range): Value.EmptyValue {
    return value.createEmptyValue({ value: null }, "(없음)", range);
  }

  private createFunctionValue(parameters: Node.FunctionNode["parameters"], body: Node.FunctionNode["body"], environment: Environment, range: Range): Value.FunctionValue {
    return value.createFunctionValue({ parameters, body, environment }, "(함수)", range);
  }

  // util predicate functions

  private isArithmeticInfixOperator(operator: string): operator is "+" | "-" | "*" | "/" {
    return ["+", "-", "*", "/"].some(infix => infix === operator);
  }

  private isComparisonInfixOperator(operator: string): operator is ComparisonOperator {
    return ["==", "!=", ">", "<", ">=", "<="].some(infix => infix === operator);
  }
}

export { default as Environment } from "./environment";
