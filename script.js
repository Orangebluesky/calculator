document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currentDisplay = document.getElementById('current-display');
    const expressionDisplay = document.getElementById('expression-display');
    const historyToggleBtn = document.getElementById('history-toggle-btn');
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const buttons = document.querySelectorAll('.keypad-grid button');

    // Calculator State
    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let shouldResetInput = false;
    let history = JSON.parse(localStorage.getItem('vibe_calc_history') || '[]');

    // Initialize UI
    updateDisplay();
    renderHistory();

    // Event Listeners for Buttons
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const value = btn.dataset.value;

            if (value && !action) {
                handleNumber(value);
            } else if (action === 'operator') {
                handleOperator(value);
            } else if (action === 'calculate') {
                handleCalculate();
            } else if (action === 'clear-all') {
                handleClearAll();
            } else if (action === 'delete') {
                handleDelete();
            } else if (action === 'percent') {
                handlePercent();
            } else if (action === 'sqrt') {
                handleSqrt();
            } else if (action === 'square') {
                handleSquare();
            } else if (action === 'toggle-sign') {
                handleToggleSign();
            }

            updateDisplay();
        });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
        else if (e.key === '.') handleNumber('.');
        else if (e.key === '+') handleOperator('+');
        else if (e.key === '-') handleOperator('-');
        else if (e.key === '*') handleOperator('*');
        else if (e.key === '/') { e.preventDefault(); handleOperator('/'); }
        else if (e.key === 'Enter' || e.key === '=') handleCalculate();
        else if (e.key === 'Backspace') handleDelete();
        else if (e.key === 'Escape') handleClearAll();
        else if (e.key === '%') handlePercent();
        updateDisplay();
    });

    // History Panel Toggle
    historyToggleBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('hidden');
    });

    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.removeItem('vibe_calc_history');
        renderHistory();
    });

    // Helper Functions
    function handleNumber(num) {
        if (currentInput === '0' || shouldResetInput) {
            if (num === '.') {
                currentInput = '0.';
            } else {
                currentInput = num;
            }
            shouldResetInput = false;
        } else {
            if (num === '.' && currentInput.includes('.')) return;
            if (currentInput.length >= 14) return; // limit length
            currentInput += num;
        }
    }

    function handleOperator(op) {
        if (operator !== null && !shouldResetInput) {
            handleCalculate();
        }
        previousInput = currentInput;
        operator = op;
        shouldResetInput = true;
    }

    function handleCalculate() {
        if (operator === null || shouldResetInput) return;

        const prev = parseFloat(previousInput);
        const curr = parseFloat(currentInput);
        let result = 0;
        let symbol = operator;

        switch (operator) {
            case '+': result = prev + curr; break;
            case '-': result = prev - curr; break;
            case '*': result = prev * curr; symbol = '×'; break;
            case '/':
                if (curr === 0) {
                    alert('0으로 나눌 수 없습니다.');
                    return;
                }
                result = prev / curr;
                symbol = '÷';
                break;
            default: return;
        }

        // Format result to prevent floating point inaccuracies
        result = Math.round(result * 1e10) / 1e10;

        const exprText = `${formatNumber(previousInput)} ${symbol} ${formatNumber(currentInput)}`;
        addHistory(exprText, result);

        currentInput = result.toString();
        operator = null;
        previousInput = '';
        shouldResetInput = true;
    }

    function handleClearAll() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetInput = false;
    }

    function handleDelete() {
        if (shouldResetInput) return;
        if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
            currentInput = '0';
        } else {
            currentInput = currentInput.slice(0, -1);
        }
    }

    function handlePercent() {
        const val = parseFloat(currentInput);
        currentInput = (val / 100).toString();
    }

    function handleSqrt() {
        const val = parseFloat(currentInput);
        if (val < 0) {
            alert('음수의 제곱근은 계산할 수 없습니다.');
            return;
        }
        const res = Math.sqrt(val);
        addHistory(`√(${formatNumber(currentInput)})`, res);
        currentInput = res.toString();
        shouldResetInput = true;
    }

    function handleSquare() {
        const val = parseFloat(currentInput);
        const res = val * val;
        addHistory(`(${formatNumber(currentInput)})²`, res);
        currentInput = res.toString();
        shouldResetInput = true;
    }

    function handleToggleSign() {
        if (currentInput === '0') return;
        if (currentInput.startsWith('-')) {
            currentInput = currentInput.slice(1);
        } else {
            currentInput = '-' + currentInput;
        }
    }

    function updateDisplay() {
        currentDisplay.textContent = formatNumber(currentInput);
        
        // Dynamically adjust font size if long number
        if (currentInput.length > 10) {
            currentDisplay.style.fontSize = '1.8rem';
        } else if (currentInput.length > 7) {
            currentDisplay.style.fontSize = '2.1rem';
        } else {
            currentDisplay.style.fontSize = '2.5rem';
        }

        if (operator && previousInput !== '') {
            let symbol = operator;
            if (operator === '*') symbol = '×';
            if (operator === '/') symbol = '÷';
            expressionDisplay.textContent = `${formatNumber(previousInput)} ${symbol}`;
        } else {
            expressionDisplay.textContent = '';
        }
    }

    function formatNumber(numStr) {
        if (numStr === 'Error' || isNaN(numStr)) return numStr;
        const parts = numStr.split('.');
        parts[0] = Number(parts[0]).toLocaleString('en-US');
        return parts.join('.');
    }

    function addHistory(expression, result) {
        const item = {
            id: Date.now(),
            expression: expression,
            result: formatNumber(result.toString()),
            rawResult: result.toString()
        };
        history.unshift(item);
        if (history.length > 20) history.pop();
        localStorage.setItem('vibe_calc_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<li class="empty-msg">기록이 없습니다.</li>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <li class="history-item" data-val="${item.rawResult}">
                <span class="expr">${item.expression}</span>
                <span class="res">= ${item.result}</span>
            </li>
        `).join('');

        // Click history item to set current value
        document.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                currentInput = el.dataset.val;
                shouldResetInput = true;
                updateDisplay();
                historyPanel.classList.add('hidden');
            });
        });
    }
});
