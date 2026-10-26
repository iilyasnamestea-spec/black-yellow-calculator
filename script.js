const display = document.getElementById('display');

let currentInput = '0';
let operator = null;
let previousValue = null;
let shouldResetDisplay = false;

function formatNumber(value) {
  if (value === 'Error') {
    return 'Error';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 'Error';
  }

  if (Number.isInteger(number)) {
    return String(number);
  }

  return Number(number.toFixed(10)).toString();
}

function updateDisplay() {
  display.textContent = currentInput;
}

function resetCalculator() {
  currentInput = '0';
  operator = null;
  previousValue = null;
  shouldResetDisplay = false;
  updateDisplay();
}

function handleNumber(value) {
  if (currentInput === 'Error') {
    currentInput = '0';
  }

  if (shouldResetDisplay) {
    currentInput = '';
    shouldResetDisplay = false;
  }

  if (currentInput === '0' && value === '0') {
    return;
  }

  if (currentInput === '0' && value !== '0') {
    currentInput = value;
  } else {
    currentInput += value;
  }

  updateDisplay();
}

function handleDecimal() {
  if (currentInput === 'Error') {
    currentInput = '0';
  }

  if (shouldResetDisplay) {
    currentInput = '0';
    shouldResetDisplay = false;
  }

  if (!currentInput.includes('.')) {
    currentInput += '.';
    updateDisplay();
  }
}

function handlePercent() {
  if (currentInput === 'Error') {
    currentInput = '0';
    updateDisplay();
    return;
  }

  const numericValue = Number(currentInput);

  if (operator && previousValue !== null) {
    currentInput = formatNumber((Number(previousValue) * numericValue) / 100);
  } else {
    currentInput = formatNumber(numericValue / 100);
  }

  shouldResetDisplay = true;
  updateDisplay();
}

function handleSign() {
  if (currentInput === 'Error') {
    return;
  }

  currentInput = formatNumber(Number(currentInput) * -1);
  updateDisplay();
}

function calculate(firstValue, secondValue, currentOperator) {
  if (currentOperator === '+') return firstValue + secondValue;
  if (currentOperator === '-') return firstValue - secondValue;
  if (currentOperator === '*') return firstValue * secondValue;
  if (currentOperator === '/') {
    if (secondValue === 0) {
      return 'Error';
    }
    return firstValue / secondValue;
  }
  return secondValue;
}

function handleOperator(nextOperator) {
  const inputValue = Number(currentInput);

  if (currentInput === 'Error') {
    return;
  }

  if (previousValue === null) {
    previousValue = inputValue;
  } else if (operator && !shouldResetDisplay) {
    previousValue = calculate(previousValue, inputValue, operator);
    currentInput = formatNumber(previousValue);
    updateDisplay();
  }

  operator = nextOperator;
  shouldResetDisplay = true;
}

function handleEquals() {
  if (currentInput === 'Error' || operator === null || previousValue === null) {
    return;
  }

  const result = calculate(previousValue, Number(currentInput), operator);
  currentInput = formatNumber(result);
  operator = null;
  previousValue = null;
  shouldResetDisplay = true;
  updateDisplay();
}

function handleDelete() {
  if (currentInput === 'Error') {
    resetCalculator();
    return;
  }

  if (shouldResetDisplay) {
    currentInput = '0';
    shouldResetDisplay = false;
    updateDisplay();
    return;
  }

  if (currentInput.length <= 1) {
    currentInput = '0';
  } else {
    currentInput = currentInput.slice(0, -1);
  }

  updateDisplay();
}

function handleAction(action, value) {
  switch (action) {
    case 'clear':
      resetCalculator();
      break;
    case 'delete':
      handleDelete();
      break;
    case 'sign':
      handleSign();
      break;
    case 'percent':
      handlePercent();
      break;
    case 'decimal':
      handleDecimal();
      break;
    case 'operator':
      handleOperator(value);
      break;
    case 'number':
      handleNumber(value);
      break;
    case 'equals':
      handleEquals();
      break;
    default:
      break;
  }
}

function handleKeyboardInput(event) {
  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    handleAction('number', key);
    return;
  }

  if (key === '.') {
    event.preventDefault();
    handleAction('decimal');
    return;
  }

  if (['+', '-', '*', '/'].includes(key)) {
    event.preventDefault();
    handleAction('operator', key);
    return;
  }

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleAction('equals');
    return;
  }

  if (key === 'Backspace') {
    event.preventDefault();
    handleAction('delete');
    return;
  }

  if (key === '%') {
    event.preventDefault();
    handleAction('percent');
    return;
  }

  if (key === 'Escape') {
    event.preventDefault();
    handleAction('clear');
    return;
  }

  if (key === '_') {
    event.preventDefault();
    handleAction('sign');
  }
}

document.querySelectorAll('.btn').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    const value = button.dataset.value || null;
    handleAction(action, value);
  });
});

document.addEventListener('keydown', handleKeyboardInput);

updateDisplay();
