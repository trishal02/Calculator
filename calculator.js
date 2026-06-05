/**
 * Core mathematical engine for the Calculator Application.
 * Includes basic operations, scientific functions, and a safe expression evaluator
 * using the Shunting-Yard algorithm to prevent the use of eval().
 */

// Basic arithmetic operations
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

export function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}

export function power(base, exponent) {
  return Math.pow(base, exponent);
}

export function sqrt(x) {
  if (x < 0) {
    throw new Error("Invalid input: negative square root");
  }
  return Math.sqrt(x);
}

// Scientific functions
export const MATH_CONSTANTS = {
  PI: Math.PI,
  E: Math.E
};

// Tokenizer and Parser (Shunting-Yard algorithm)
export function evaluate(expression) {
  // Pre-process expression: replace symbols and handle implicit multiplication
  let formattedExpr = expression
    .replace(/\s+/g, "") // remove whitespace
    .replace(/π/g, "pi")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-"); // standard minus char vs dash

  // Tokenize the expression
  const tokens = tokenize(formattedExpr);
  
  // Parse and evaluate using Shunting-Yard
  return parseAndEvaluate(tokens);
}

function tokenize(str) {
  const tokens = [];
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    // Numbers (including decimals)
    if (/[0-9.]/.test(char)) {
      let numStr = "";
      while (i < str.length && /[0-9.]/.test(str[i])) {
        numStr += str[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: parseFloat(numStr) });
      continue;
    }

    // Letters (functions like sin, cos, tan, ln, log, sqrt, or constants like pi, e)
    if (/[a-zA-Z]/.test(char)) {
      let name = "";
      while (i < str.length && /[a-zA-Z]/.test(str[i])) {
        name += str[i];
        i++;
      }
      
      const lowerName = name.toLowerCase();
      if (lowerName === "pi") {
        tokens.push({ type: "NUMBER", value: Math.PI });
      } else if (lowerName === "e") {
        tokens.push({ type: "NUMBER", value: Math.E });
      } else if (["sin", "cos", "tan", "ln", "log", "sqrt"].includes(lowerName)) {
        tokens.push({ type: "FUNCTION", value: lowerName });
      } else {
        throw new Error(`Unknown identifier: ${name}`);
      }
      continue;
    }

    // Operators and Parentheses
    if (["+", "-", "*", "/", "^", "(", ")"].includes(char)) {
      // Unary minus/plus handling:
      // If a '-' or '+' follows an operator or open parenthesis, or is at the start of expression:
      if ((char === "-" || char === "+") && 
          (tokens.length === 0 || 
           (tokens[tokens.length - 1].type === "OPERATOR") || 
           (tokens[tokens.length - 1].value === "("))) {
        // We push a 0 before the unary operator to treat it as "0 - x"
        if (char === "-") {
          tokens.push({ type: "NUMBER", value: 0 });
          tokens.push({ type: "OPERATOR", value: "-" });
        }
        // for '+', we can just ignore it (unary plus)
      } else {
        tokens.push({ 
          type: char === "(" || char === ")" ? "PAREN" : "OPERATOR", 
          value: char 
        });
      }
      i++;
      continue;
    }

    throw new Error(`Invalid character: ${char}`);
  }

  return tokens;
}

const PRECEDENCE = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "^": 3
};

const ASSOCIATIVITY = {
  "+": "LEFT",
  "-": "LEFT",
  "*": "LEFT",
  "/": "LEFT",
  "^": "RIGHT"
};

function parseAndEvaluate(tokens) {
  const outputQueue = [];
  const operatorStack = [];

  for (const token of tokens) {
    if (token.type === "NUMBER") {
      outputQueue.push(token);
    } else if (token.type === "FUNCTION") {
      operatorStack.push(token);
    } else if (token.type === "OPERATOR") {
      let topOp = operatorStack[operatorStack.length - 1];
      while (
        topOp &&
        (topOp.type === "OPERATOR" &&
          ((ASSOCIATIVITY[token.value] === "LEFT" &&
            PRECEDENCE[token.value] <= PRECEDENCE[topOp.value]) ||
            (ASSOCIATIVITY[token.value] === "RIGHT" &&
              PRECEDENCE[token.value] < PRECEDENCE[topOp.value])))
      ) {
        outputQueue.push(operatorStack.pop());
        topOp = operatorStack[operatorStack.length - 1];
      }
      operatorStack.push(token);
    } else if (token.value === "(") {
      operatorStack.push(token);
    } else if (token.value === ")") {
      let topOp = operatorStack[operatorStack.length - 1];
      while (topOp && topOp.value !== "(") {
        outputQueue.push(operatorStack.pop());
        topOp = operatorStack[operatorStack.length - 1];
      }
      if (!topOp) {
        throw new Error("Mismatched parentheses");
      }
      operatorStack.pop(); // Pop the "("

      // If the top of the stack is a function, pop it onto the output queue
      const nextTop = operatorStack[operatorStack.length - 1];
      if (nextTop && nextTop.type === "FUNCTION") {
        outputQueue.push(operatorStack.pop());
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (op.value === "(" || op.value === ")") {
      throw new Error("Mismatched parentheses");
    }
    outputQueue.push(op);
  }

  // RPN Evaluation Stack
  const evalStack = [];
  for (const token of outputQueue) {
    if (token.type === "NUMBER") {
      evalStack.push(token.value);
    } else if (token.type === "OPERATOR") {
      if (evalStack.length < 2) {
        throw new Error("Invalid expression syntax");
      }
      const b = evalStack.pop();
      const a = evalStack.pop();
      let res;
      switch (token.value) {
        case "+": res = add(a, b); break;
        case "-": res = subtract(a, b); break;
        case "*": res = multiply(a, b); break;
        case "/": res = divide(a, b); break;
        case "^": res = power(a, b); break;
        default: throw new Error(`Unknown operator: ${token.value}`);
      }
      evalStack.push(res);
    } else if (token.type === "FUNCTION") {
      if (evalStack.length < 1) {
        throw new Error("Invalid function arguments");
      }
      const arg = evalStack.pop();
      let res;
      switch (token.value) {
        case "sin": res = Math.sin(arg); break;
        case "cos": res = Math.cos(arg); break;
        case "tan": res = Math.tan(arg); break;
        case "sqrt": res = sqrt(arg); break;
        case "ln": 
          if (arg <= 0) throw new Error("Invalid log argument");
          res = Math.log(arg); 
          break;
        case "log": 
          if (arg <= 0) throw new Error("Invalid log argument");
          res = Math.log10(arg); 
          break;
        default: throw new Error(`Unknown function: ${token.value}`);
      }
      evalStack.push(res);
    }
  }

  if (evalStack.length !== 1) {
    throw new Error("Invalid expression structure");
  }

  // Helper to round floating-point errors (e.g. 0.1 + 0.2 = 0.30000000000000004)
  const result = evalStack[0];
  if (typeof result === "number" && !isNaN(result)) {
    // If it's a very long floating number, round to 12 decimal places
    return parseFloat(result.toFixed(12));
  }
  return result;
}
