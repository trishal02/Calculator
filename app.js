import { evaluate } from "./calculator.js";

// DOM Elements
const displayFormula = document.getElementById("display-formula");
const displayCurrent = document.getElementById("display-current");
const themeToggle = document.getElementById("theme-toggle");
const historyToggle = document.getElementById("history-toggle");
const modeToggle = document.getElementById("mode-toggle");
const historyPanel = document.getElementById("history-panel");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");
const scientificKeys = document.getElementById("scientific-keys");
const calcContainer = document.querySelector(".calculator-container");
const keys = document.querySelectorAll(".key");

// State Variables
let currentExpression = "";
let lastResult = "";
let isEvaluated = false;
let history = JSON.parse(localStorage.getItem("calc-history")) || [];

// Initialize Page
init();

function init() {
  // Setup theme
  setupTheme();
  
  // Render history list
  renderHistory();
  
  // Setup event listeners
  setupEventListeners();
}

/* ==========================================================================
   Theme Management (Matching Guidance)
   ========================================================================== */
function setupTheme() {
  const savedTheme = localStorage.getItem("color-scheme");
  
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.querySelector('meta[name="color-scheme"]').content = savedTheme;
  } else {
    // Default to system preference
    document.documentElement.removeAttribute("data-theme");
    document.querySelector('meta[name="color-scheme"]').content = "light dark";
  }

  // Handle system theme updates at runtime
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!localStorage.getItem("color-scheme")) {
      // If user hasn't explicitly set a preference, let it adapt automatically
      document.querySelector('meta[name="color-scheme"]').content = "light dark";
    }
  });
}

function toggleTheme() {
  const currentTheme = localStorage.getItem("color-scheme") || 
                       (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  localStorage.setItem("color-scheme", newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
  document.querySelector('meta[name="color-scheme"]').content = newTheme;
}

/* ==========================================================================
   Calculator Operations & Logic
   ========================================================================== */
function updateDisplay() {
  // Prettify formula for display (replace code characters with user-friendly symbols)
  let displayExpr = currentExpression
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ")
    .replace(/-/g, " − ")
    .replace(/\+/g, " + ")
    .replace(/\^/g, " ^ ");
    
  displayFormula.textContent = displayExpr;

  // Real-time calculation helper
  if (currentExpression && !isEvaluated) {
    try {
      // Automatically close parentheses if they aren't fully closed to estimate intermediate result
      let closedExpression = autoCloseParentheses(currentExpression);
      const tempResult = evaluate(closedExpression);
      
      if (tempResult !== undefined && !isNaN(tempResult)) {
        displayCurrent.textContent = formatNumber(tempResult);
      }
    } catch {
      // Silent catch: do not show errors during intermediate typing
    }
  } else if (!currentExpression) {
    displayCurrent.textContent = "0";
  }
}

function handleInput(value) {
  if (isEvaluated) {
    // If we just got a result and start typing a number, start fresh
    if (/[0-9.eπ]/.test(value)) {
      currentExpression = value;
    } else if (["+", "-", "*", "/", "^"].includes(value)) {
      // If we start with an operator, apply it to the last result
      currentExpression = lastResult + value;
    } else {
      currentExpression = value;
    }
    isEvaluated = false;
  } else {
    currentExpression += value;
  }
  updateDisplay();
}

function handleAction(action) {
  switch (action) {
    case "clear":
      currentExpression = "";
      lastResult = "";
      isEvaluated = false;
      displayFormula.textContent = "";
      displayCurrent.textContent = "0";
      break;
      
    case "backspace":
      if (isEvaluated) {
        currentExpression = "";
        isEvaluated = false;
      } else if (currentExpression.length > 0) {
        // Check if removing a function call like sin(, cos(, tan(, sqrt(, log(, ln(
        const funcMatch = currentExpression.match(/(sin\(|cos\(|tan\(|sqrt\(|log\(|ln\()$/);
        if (funcMatch) {
          currentExpression = currentExpression.substring(0, currentExpression.length - funcMatch[0].length);
        } else {
          currentExpression = currentExpression.slice(0, -1);
        }
      }
      updateDisplay();
      break;
      
    case "sin":
    case "cos":
    case "tan":
    case "sqrt":
    case "log":
    case "ln":
      handleInput(`${action}(`);
      break;
      
    case "pow":
      handleInput("^");
      break;
      
    case "equals":
      performCalculation();
      break;
  }
}

function performCalculation() {
  if (!currentExpression) return;
  
  try {
    const finalExpression = autoCloseParentheses(currentExpression);
    const result = evaluate(finalExpression);
    
    if (result === undefined || isNaN(result)) {
      throw new Error("Invalid operation");
    }
    
    // Format expression for the history log
    const prettifiedFormula = currentExpression
      .replace(/\*/g, " × ")
      .replace(/\//g, " ÷ ")
      .replace(/-/g, " − ");

    lastResult = result;
    isEvaluated = true;
    
    // Save to history
    saveToHistory(prettifiedFormula, result);
    
    // Update displays
    displayFormula.textContent = prettifiedFormula + " =";
    displayCurrent.textContent = formatNumber(result);
    currentExpression = String(result);
  } catch {
    displayCurrent.textContent = "Error";
    // Keep current expression so they can correct it, but mark evaluated false
    isEvaluated = false;
  }
}

// Automatically appends missing closing brackets
function autoCloseParentheses(expr) {
  const openCount = (expr.match(/\(/g) || []).length;
  const closeCount = (expr.match(/\)/g) || []).length;
  
  let resultExpr = expr;
  if (openCount > closeCount) {
    resultExpr += ")".repeat(openCount - closeCount);
  }
  return resultExpr;
}

function formatNumber(num) {
  if (typeof num !== "number") return num;
  
  // If it is exponential (very small or very large)
  if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(6);
  }
  
  // Format long decimals nicely
  return Number(num.toString());
}

/* ==========================================================================
   History Operations
   ========================================================================== */
function saveToHistory(formula, result) {
  const item = {
    id: Date.now(),
    formula: formula,
    result: formatNumber(result)
  };
  
  history.unshift(item);
  // Keep only the last 20 calculations
  if (history.length > 20) history.pop();
  
  localStorage.setItem("calc-history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<div class="no-history">No calculations yet</div>';
    return;
  }
  
  historyList.innerHTML = history
    .map(item => `
      <div class="history-item" data-formula="${item.formula}" data-result="${item.result}">
        <span class="history-item-formula">${item.formula}</span>
        <span class="history-item-result">${item.result}</span>
      </div>
    `)
    .join("");

  // Add click listener to history items
  document.querySelectorAll(".history-item").forEach(item => {
    item.addEventListener("click", () => {
      currentExpression = item.getAttribute("data-formula")
        .replace(/ × /g, "*")
        .replace(/ ÷ /g, "/")
        .replace(/ − /g, "-")
        .replace(/ \+ /g, "+");
      isEvaluated = false;
      updateDisplay();
      historyPanel.classList.add("hidden");
    });
  });
}

function clearHistory() {
  history = [];
  localStorage.removeItem("calc-history");
  renderHistory();
}

/* ==========================================================================
   Event Listeners
   ========================================================================== */
function setupEventListeners() {
  // Theme Toggle Button
  themeToggle.addEventListener("click", toggleTheme);

  // History Panel Drawer Toggles
  historyToggle.addEventListener("click", () => {
    historyPanel.classList.toggle("hidden");
  });
  
  clearHistoryBtn.addEventListener("click", clearHistory);

  // Mode Toggle (SCI Mode)
  modeToggle.addEventListener("click", () => {
    const isSciActive = calcContainer.classList.toggle("scientific-active");
    scientificKeys.classList.toggle("hidden");
    modeToggle.classList.toggle("active");
    
    // Save preference
    localStorage.setItem("calc-sci-mode", isSciActive);
  });

  // Load sci mode preference
  if (localStorage.getItem("calc-sci-mode") === "true") {
    calcContainer.classList.add("scientific-active");
    scientificKeys.classList.remove("hidden");
    modeToggle.classList.add("active");
  }

  // Keypad Button Clicks
  keys.forEach(key => {
    key.addEventListener("click", () => {
      const val = key.getAttribute("data-value");
      const action = key.getAttribute("data-action");
      
      if (val !== null) {
        // Map visual operators to code operators
        let inputVal = val;
        if (val === "×") inputVal = "*";
        if (val === "÷") inputVal = "/";
        if (val === "−") inputVal = "-";
        if (val === "π") inputVal = "pi";
        handleInput(inputVal);
      } else if (action !== null) {
        handleAction(action);
      }
    });
  });

  // Keyboard Support
  window.addEventListener("keydown", (e) => {
    // If user is focused on inputs or other elements, do not capture
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
      return;
    }
    
    const key = e.key;
    
    // Numbers
    if (/[0-9.]/.test(key)) {
      handleInput(key);
    }
    
    // Basic Operators
    else if (key === "+") handleInput("+");
    else if (key === "-") handleInput("-");
    else if (key === "*") handleInput("*");
    else if (key === "/") handleInput("/");
    else if (key === "^") handleInput("^");
    else if (key === "(") handleInput("(");
    else if (key === ")") handleInput(")");
    
    // Actions
    else if (key === "Enter" || key === "=") {
      e.preventDefault();
      performCalculation();
    }
    else if (key === "Backspace") {
      handleAction("backspace");
    }
    else if (key === "Escape") {
      handleAction("clear");
    }
  });
}
