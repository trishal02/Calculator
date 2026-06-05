import { describe, test, expect } from "vitest";
import { 
  add, 
  subtract, 
  multiply, 
  divide, 
  power, 
  sqrt, 
  evaluate 
} from "./calculator.js";

describe("Basic Arithmetic functions", () => {
  test("adds numbers correctly", () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 5)).toBe(4);
  });

  test("subtracts numbers correctly", () => {
    expect(subtract(5, 3)).toBe(2);
    expect(subtract(2, 5)).toBe(-3);
  });

  test("multiplies numbers correctly", () => {
    expect(multiply(4, 3)).toBe(12);
    expect(multiply(-2, 3)).toBe(-6);
  });

  test("divides numbers correctly", () => {
    expect(divide(6, 3)).toBe(2);
    expect(divide(5, 2)).toBe(2.5);
  });

  test("throws error when dividing by zero", () => {
    expect(() => divide(6, 0)).toThrow("Cannot divide by zero");
  });

  test("calculates power correctly", () => {
    expect(power(2, 3)).toBe(8);
    expect(power(5, 0)).toBe(1);
  });

  test("calculates square root correctly", () => {
    expect(sqrt(9)).toBe(3);
    expect(() => sqrt(-4)).toThrow("Invalid input: negative square root");
  });
});

describe("Expression Evaluator (Shunting-Yard)", () => {
  test("evaluates simple expressions", () => {
    expect(evaluate("2+3")).toBe(5);
    expect(evaluate("10-4")).toBe(6);
    expect(evaluate("3*4")).toBe(12);
    expect(evaluate("8/2")).toBe(4);
  });

  test("handles operator precedence", () => {
    expect(evaluate("2+3*4")).toBe(14);
    expect(evaluate("3*4+2")).toBe(14);
    expect(evaluate("10-4/2")).toBe(8);
  });

  test("handles parentheses properly", () => {
    expect(evaluate("(2+3)*4")).toBe(20);
    expect(evaluate("2*(3+4)")).toBe(14);
    expect(evaluate("((2+3)*4)/2")).toBe(10);
  });

  test("handles floating point precision", () => {
    expect(evaluate("0.1+0.2")).toBe(0.3);
  });

  test("handles constants (pi, e)", () => {
    expect(evaluate("pi")).toBeCloseTo(Math.PI, 10);
    expect(evaluate("e")).toBeCloseTo(Math.E, 10);
    expect(evaluate("2*pi")).toBeCloseTo(2 * Math.PI, 10);
  });

  test("handles unary minus", () => {
    expect(evaluate("-5+3")).toBe(-2);
    expect(evaluate("5+-3")).toBe(2);
    expect(evaluate("-(5+3)")).toBe(-8);
  });

  test("handles scientific functions", () => {
    expect(evaluate("sin(0)")).toBe(0);
    expect(evaluate("cos(0)")).toBe(1);
    expect(evaluate("sqrt(16)")).toBe(4);
    expect(evaluate("log(100)")).toBe(2);
    expect(evaluate("ln(e)")).toBe(1);
  });

  test("throws error on invalid expression syntax", () => {
    expect(() => evaluate("2+*3")).toThrow();
    expect(() => evaluate("(2+3")).toThrow("Mismatched parentheses");
  });
});
