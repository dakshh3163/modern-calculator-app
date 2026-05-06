'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  currentValue: '0',
  previousValue: '',
  operator: null,
  shouldResetScreen: false,
  expressionStr: '',
};

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_PRECISION = 12;   // significant digits kept during formatting
const MAX_INPUT_LENGTH = 12; // maximum digits the user can enter
const SHRINK_THRESHOLD = 12; // result length that triggers small font
const SHRINK2_THRESHOLD = 8; // result length that triggers smaller font

// ── DOM refs ───────────────────────────────────────────────────────────────
const resultEl = document.getElementById('result');
const expressionEl = document.getElementById('expression');

// ── Helpers ────────────────────────────────────────────────────────────────

/** Display a number, trimming unnecessary float precision. */
function formatNumber(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return 'Error';

  // Limit to MAX_PRECISION significant digits to avoid floating-point noise
  const str = parseFloat(n.toPrecision(MAX_PRECISION)).toString();
  return str;
}

/** Update the display, shrinking text for long results. */
function updateDisplay(value, expression = null) {
  resultEl.textContent = value;
  resultEl.classList.remove('shrink', 'shrink-2');

  if (value.length > SHRINK_THRESHOLD) resultEl.classList.add('shrink-2');
  else if (value.length > SHRINK2_THRESHOLD) resultEl.classList.add('shrink');

  if (expression !== null) expressionEl.textContent = expression;
}

/** Remove the `.active` highlight from all operator buttons. */
function clearOperatorHighlight() {
  document.querySelectorAll('.btn-operator').forEach((b) =>
    b.classList.remove('active')
  );
}

/** Highlight the currently selected operator button. */
function highlightOperator(op) {
  clearOperatorHighlight();
  document.querySelectorAll('[data-action="operator"]').forEach((b) => {
    if (b.dataset.value === op) b.classList.add('active');
  });
}

// ── Calculator actions ─────────────────────────────────────────────────────

function inputNumber(digit) {
  if (state.shouldResetScreen) {
    state.currentValue = digit;
    state.shouldResetScreen = false;
  } else {
    if (state.currentValue === '0' && digit !== '.') {
      state.currentValue = digit;
    } else {
      if (state.currentValue.length >= MAX_INPUT_LENGTH) return; // max digits
      state.currentValue += digit;
    }
  }
  updateDisplay(state.currentValue);
}

function inputDecimal() {
  if (state.shouldResetScreen) {
    state.currentValue = '0.';
    state.shouldResetScreen = false;
    updateDisplay(state.currentValue);
    return;
  }
  if (!state.currentValue.includes('.')) {
    state.currentValue += '.';
    updateDisplay(state.currentValue);
  }
}

function chooseOperator(op) {
  if (state.operator && !state.shouldResetScreen) {
    calculate(); // chain: 3 + 5 × …  → evaluate first
  }

  state.previousValue = state.currentValue;
  state.operator = op;
  state.shouldResetScreen = true;
  state.expressionStr = `${formatNumber(state.previousValue)} ${op}`;

  highlightOperator(op);
  updateDisplay(state.currentValue, state.expressionStr);
}

function calculate() {
  if (!state.operator || state.shouldResetScreen) return;

  const prev = parseFloat(state.previousValue);
  const curr = parseFloat(state.currentValue);

  if (isNaN(prev) || isNaN(curr)) return;

  let result;
  switch (state.operator) {
    case '+': result = prev + curr; break;
    case '−': result = prev - curr; break;
    case '×': result = prev * curr; break;
    case '÷':
      if (curr === 0) {
        resetState();
        updateDisplay('Error', '');
        return;
      }
      result = prev / curr;
      break;
    default: return;
  }

  const expression = `${formatNumber(prev)} ${state.operator} ${formatNumber(curr)} =`;
  const formatted = formatNumber(String(result));

  // Update state
  state.expressionStr = expression;
  state.currentValue = formatted;
  state.operator = null;
  state.previousValue = '';
  state.shouldResetScreen = true;

  clearOperatorHighlight();
  updateDisplay(formatted, expression);
}

function clearAll() {
  resetState();
  updateDisplay('0', '');
}

function toggleSign() {
  if (state.currentValue === '0' || state.currentValue === 'Error') return;
  state.currentValue = state.currentValue.startsWith('-')
    ? state.currentValue.slice(1)
    : '-' + state.currentValue;
  updateDisplay(state.currentValue);
}

function applyPercent() {
  if (state.currentValue === 'Error') return;
  const val = parseFloat(state.currentValue) / 100;
  state.currentValue = formatNumber(String(val));
  updateDisplay(state.currentValue);
}

function resetState() {
  state.currentValue = '0';
  state.previousValue = '';
  state.operator = null;
  state.shouldResetScreen = false;
  state.expressionStr = '';
  clearOperatorHighlight();
}

// ── Event delegation ────────────────────────────────────────────────────────

document.querySelector('.buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const { action, value } = btn.dataset;

  switch (action) {
    case 'number':   inputNumber(value);    break;
    case 'decimal':  inputDecimal();        break;
    case 'operator': chooseOperator(value); break;
    case 'equals':   calculate();           break;
    case 'clear':    clearAll();            break;
    case 'sign':     toggleSign();          break;
    case 'percent':  applyPercent();        break;
  }
});

// ── Keyboard support ────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key;

  if (key >= '0' && key <= '9') { inputNumber(key); return; }

  switch (key) {
    case '.':        inputDecimal();                         break;
    case '+':        chooseOperator('+');                    break;
    case '-':        chooseOperator('−');                    break;
    case '*':        chooseOperator('×');                    break;
    case '/':        e.preventDefault(); chooseOperator('÷'); break;
    case 'Enter':
    case '=':        calculate();                            break;
    case 'Escape':   clearAll();                             break;
    case '%':        applyPercent();                         break;
    case 'Backspace':
      if (state.currentValue.length > 1 && !state.shouldResetScreen) {
        state.currentValue = state.currentValue.slice(0, -1) || '0';
        updateDisplay(state.currentValue);
      } else {
        state.currentValue = '0';
        updateDisplay(state.currentValue);
      }
      break;
  }
});

// ── Init ────────────────────────────────────────────────────────────────────
updateDisplay('0', '');
