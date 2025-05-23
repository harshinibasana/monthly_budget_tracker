let db;
let totalIncome = 0;
let expenses = [];

const incomeEl = document.getElementById('totalIncome');
const expenseEl = document.getElementById('totalExpenses');
const savingsEl = document.getElementById('savings');
const expenseList = document.getElementById('expenseList');
const chartCtx = document.getElementById('expenseChart').getContext('2d');

let chart;

// IndexedDB setup
const request = indexedDB.open("ExpenseDB", 1);

request.onerror = function (event) {
  console.error("IndexedDB error:", event.target.error);
};

request.onsuccess = function (event) {
  db = event.target.result;
  loadData();
};

request.onupgradeneeded = function (event) {
  db = event.target.result;
  const store = db.createObjectStore("expenses", { keyPath: "id", autoIncrement: true });
  store.createIndex("category", "category", { unique: false });
};

function saveIncome() {
  totalIncome = parseFloat(document.getElementById('income').value) || 0;
  updateUI();
}

function addExpense() {
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value.trim();

  if (!amount || !category) {
    alert("Please fill in valid expense amount and category.");
    return;
  }

  const expense = { amount, category };

  const tx = db.transaction(["expenses"], "readwrite");
  const store = tx.objectStore("expenses");
  store.add(expense);

  tx.oncomplete = () => loadData();
}

function loadData() {
  expenses = [];
  const tx = db.transaction(["expenses"], "readonly");
  const store = tx.objectStore("expenses");

  store.openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      expenses.push(cursor.value);
      cursor.continue();
    } else {
      renderExpenses();
      updateUI();
    }
  };
}

function renderExpenses() {
  expenseList.innerHTML = "";
  expenses.forEach(e => {
    const li = document.createElement('li');
    li.textContent = `${e.category}: $${e.amount}`;
    expenseList.appendChild(li);
  });
}

function updateUI() {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const savings = totalIncome - totalExpenses;

  incomeEl.textContent = totalIncome.toFixed(2);
  expenseEl.textContent = totalExpenses.toFixed(2);
  savingsEl.textContent = savings.toFixed(2);

  if (totalIncome > 0 && totalExpenses > totalIncome * 0.8) {
    alert("⚠️ You're spending more than 80% of your income!");
  }

  updateChart();
}

function updateChart() {
  const categoryTotals = {};

  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (chart) chart.destroy();

  chart = new Chart(chartCtx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Expenses by Category',
        data: data,
        backgroundColor: [
          '#0074D9', '#FF4136', '#2ECC40', '#FF851B', '#B10DC9', '#FFDC00'
        ]
      }]
    }
  });
}
