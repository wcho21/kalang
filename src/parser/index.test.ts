import Lexer from "../lexer";
import Parser from "./";
import type { Program } from "./syntax-tree";

describe("parseProgram()", () => {
  const testParsing = ({ input, expected }: { input: string, expected: Program }) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const node = parser.parseProgram();

    expect(node).toEqual(expected);
  };

  describe("assignment", () => {
    const cases: { name: string, input: string, expected: Program }[] = [
      {
        name: "a single assignment statement",
        input: "x = 42",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "assignment",
                left: { type: "identifier", value: "x" },
                right: { type: "number node", value: 42 },
              },
            },
          ],
        },
      },
      {
        name: "multiple assignment statements",
        input: "x = 42 한 = 9 _123 = 123",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "assignment",
                left: { type: "identifier", value: "x" },
                right: { type: "number node", value: 42 },
              },
            },
            {
              type: "expression statement",
              expression: {
                type: "assignment",
                left: { type: "identifier", value: "한" },
                right: { type: "number node", value: 9 },
              },
            },
            {
              type: "expression statement",
              expression: {
                type: "assignment",
                left: { type: "identifier", value: "_123" },
                right: { type: "number node", value: 123 },
              },
            },
          ],
        },
      },
    ];

    it.each(cases)("parse $name", testParsing);
  });

  describe("comparison expression", () => {
    const cases: { name: string, input: string, expected: Program }[] = [
      {
        name: "equal-to comparison",
        input: "x == y",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "==",
                left: { type: "identifier", value: "x" },
                right: { type: "identifier", value: "y" },
              },
            },
          ],
        },
      },
      {
        name: "not-equal-to comparison",
        input: "x != y",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "!=",
                left: { type: "identifier", value: "x" },
                right: { type: "identifier", value: "y" },
              },
            },
          ],
        },
      },
      {
        name: "greater-than comparison",
        input: "x > y",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: ">",
                left: { type: "identifier", value: "x" },
                right: { type: "identifier", value: "y" },
              },
            },
          ],
        },
      },
      {
        name: "less-than comparison",
        input: "x < y",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "<",
                left: { type: "identifier", value: "x" },
                right: { type: "identifier", value: "y" },
              },
            },
          ],
        },
      },
      {
        name: "greater-than-or-equal-to comparison",
        input: "x >= y",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: ">=",
                left: { type: "identifier", value: "x" },
                right: { type: "identifier", value: "y" },
              },
            },
          ],
        },
      },
      {
        name: "less-than-or-equal-to comparison",
        input: "x <= y",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "<=",
                left: { type: "identifier", value: "x" },
                right: { type: "identifier", value: "y" },
              },
            },
          ],
        },
      },
      {
        name: "left associative comparison",
        input: "x <= y == z",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "==",
                left: {
                  type: "infix expression",
                  infix: "<=",
                  left: { type: "identifier", value: "x" },
                  right: { type: "identifier", value: "y" },
                },
                right: { type: "identifier", value: "z" },
              },
            },
          ],
        },
      },
      {
        name: "complex grouped comparison",
        input: "x == (y >= z)",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "==",
                left: { type: "identifier", value: "x" },
                right: {
                  type: "infix expression",
                  infix: ">=",
                  left: { type: "identifier", value: "y" },
                  right: { type: "identifier", value: "z" },
                },
              },
            },
          ],
        },
      },
    ];

    it.each(cases)("parse $name", testParsing);
  });

  describe("simple expression", () => {
    const cases: { name: string, input: string, expected: Program }[] = [
      {
        name: "an identifier",
        input: "x",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: { type: "identifier", value: "x" },
            },
          ],
        },
      },
      {
        name: "a number",
        input: "123",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: { type: "number node", value: 123 },
            },
          ],
        },
      },
      {
        name: "a negative number",
        input: "-42",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "prefix expression",
                prefix: "-",
                expression: { type: "number node", value: 42 },
              },
            },
          ],
        },
      },
      {
        name: "a doubly negative number",
        input: "--42",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "prefix expression",
                prefix: "-",
                expression: {
                  type: "prefix expression",
                  prefix: "-",
                  expression: { type: "number node", value: 42 },
                },
              },
            },
          ],
        },
      },
      {
        name: "a positive number",
        input: "+42",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "prefix expression",
                prefix: "+",
                expression: { type: "number node", value: 42 },
              },
            },
          ],
        },
      },
      {
        name: "an addition of two numbers",
        input: "42+99",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: { type: "number node", value: 42 },
                right: { type: "number node", value: 99 },
              },
            },
          ],
        },
      },
      {
        name: "an addition with the first negative number",
        input: "-42+99",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: {
                  type: "prefix expression",
                  prefix: "-",
                  expression: { type: "number node", value: 42 },
                },
                right: { type: "number node", value: 99 },
              },
            },
          ],
        },
      },
      {
        name: "an addition with the second negative number",
        input: "42+-99",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: { type: "number node", value: 42 },
                right: {
                  type: "prefix expression",
                  prefix: "-",
                  expression: { type: "number node", value: 99 },
                },
              },
            },
          ],
        },
      },
      {
        name: "an addition of two negative numbers",
        input: "-42+-99",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: {
                  type: "prefix expression",
                  prefix: "-",
                  expression: { type: "number node", value: 42 },
                },
                right: {
                  type: "prefix expression",
                  prefix: "-",
                  expression: { type: "number node", value: 99 },
                },
              },
            },
          ],
        },
      },
      {
        name: "an addition of two positive numbers",
        input: "+42++99",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: {
                  type: "prefix expression",
                  prefix: "+",
                  expression: { type: "number node", value: 42 },
                },
                right: {
                  type: "prefix expression",
                  prefix: "+",
                  expression: { type: "number node", value: 99 },
                },
              },
            },
          ],
        },
      },
      {
        name: "a subtraction of two numbers",
        input: "42-99",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "-",
                left: { type: "number node", value: 42 },
                right: { type: "number node", value: 99 },
              },
            },
          ],
        },
      },
      {
        name: "a multiplication of two numbers",
        input: "42*99",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "*",
                left: { type: "number node", value: 42 },
                right: { type: "number node", value: 99 },
              },
            },
          ],
        },
      },
      {
        name: "a division of two numbers",
        input: "42/99",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "/",
                left: { type: "number node", value: 42 },
                right: { type: "number node", value: 99 },
              },
            },
          ],
        },
      },
      {
        name: "an addition of three numbers, left associative",
        input: "42+99+12",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: {
                  type: "infix expression",
                  infix: "+",
                  left: { type: "number node", value: 42 },
                  right: { type: "number node", value: 99 },
                },
                right: { type: "number node", value: 12 },
              },
            },
          ],
        },
      },
      {
        name: "addition and multiplication",
        input: "42+99*12",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: { type: "number node", value: 42 },
                right: {
                  type: "infix expression",
                  infix: "*",
                  left: { type: "number node", value: 99 },
                  right: { type: "number node", value: 12 },
                },
              },
            },
          ],
        },
      },
      {
        name: "multiplication and addition",
        input: "42*99+12",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: {
                  type: "infix expression",
                  infix: "*",
                  left: { type: "number node", value: 42 },
                  right: { type: "number node", value: 99 },
                },
                right: { type: "number node", value: 12 },
              },
            },
          ],
        },
      },
      {
        name: "an addition with grouped expression",
        input: "12+(34+56)",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: { type: "number node", value: 12 },
                right: {
                  type: "infix expression",
                  infix: "+",
                  left: { type: "number node", value: 34 },
                  right: { type: "number node", value: 56 },
                },
              },
            },
          ],
        },
      },
      {
        name: "an addition with grouped more than once",
        input: "12+(34+(56+(78+9)))",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: { type: "number node", value: 12 },
                right: {
                  type: "infix expression",
                  infix: "+",
                  left: { type: "number node", value: 34 },
                  right: {
                    type: "infix expression",
                    infix: "+",
                    left: { type: "number node", value: 56 },
                    right: {
                      type: "infix expression",
                      infix: "+",
                      left: { type: "number node", value: 78 },
                      right: { type: "number node", value: 9 },
                    },
                  },
                },
              },
            },
          ],
        },
      },
      {
        name: "arithmetic expression with grouped more than once",
        input: "(12*(34/56))+(7-((8+9)*10))",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: {
                  type: "infix expression",
                  infix: "*",
                  left: { type: "number node", value: 12 },
                  right: {
                    type: "infix expression",
                    infix: "/",
                    left: { type: "number node", value: 34 },
                    right: { type: "number node", value: 56 },
                  },
                },
                right: {
                  type: "infix expression",
                  infix: "-",
                  left: { type: "number node", value: 7 },
                  right: {
                    type: "infix expression",
                    infix: "*",
                    left: {
                      type: "infix expression",
                      infix: "+",
                      left: { type: "number node", value: 8 },
                      right: { type: "number node", value: 9 },
                    },
                    right: { type: "number node", value: 10 },
                  },
                },
              },
            },
          ],
        },
      },
      {
        name: "arithmetic expression with floating point numbers",
        input: "0.75 + 1.25",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: {
                type: "infix expression",
                infix: "+",
                left: { type: "number node", value: 0.75 },
                right: { type: "number node", value: 1.25 },
              },
            },
          ],
        },
      },
      {
        name: "true boolean literal",
        input: "참",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: { type: "boolean node", value: true },
            },
          ],
        },
      },
      {
        name: "false boolean literal",
        input: "거짓",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: { type: "boolean node", value: false },
            },
          ],
        },
      },
      {
        name: "string literal",
        input: "'foo bar'",
        expected: {
          type: "program",
          statements: [
            {
              type: "expression statement",
              expression: { type: "string node", value: "foo bar" },
            },
          ],
        },
      },
    ];

    it.each(cases)("parse $name", testParsing);
  });
});
