// Enhanced state management
const state = {
  transactions: [],
  archives: JSON.parse(localStorage.getItem("archives")) || {},
  currentMonth: null,
  selectedMonth: null,
};

// Utility functions
const getMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-");
  return new Date(year, parseInt(month) - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const getCurrentMonthKey = () => getMonthKey(new Date());

const saveToLocalStorage = () => {
  const currentMonth = getCurrentMonthKey();

  // Archive current month's transactions
  if (state.currentMonth && state.currentMonth !== currentMonth) {
    state.archives[state.currentMonth] = [...state.transactions];
  }

  // Update localStorage
  localStorage.setItem("archives", JSON.stringify(state.archives));
  localStorage.setItem(
    "currentTransactions",
    JSON.stringify(state.transactions)
  );

  state.currentMonth = currentMonth;
};

const loadTransactions = () => {
  const currentMonth = getCurrentMonthKey();

  // If it's a new month, archive the old transactions
  if (state.currentMonth && state.currentMonth !== currentMonth) {
    state.archives[state.currentMonth] = [...state.transactions];
    state.transactions = [];
  }

  // Load appropriate transactions based on selection
  if (state.selectedMonth && state.selectedMonth !== currentMonth) {
    state.transactions = state.archives[state.selectedMonth] || [];
  } else {
    state.transactions =
      JSON.parse(localStorage.getItem("currentTransactions")) || [];
  }

  state.currentMonth = currentMonth;
};

// UI Update Functions
const updateArchiveSelector = () => {
  const selector = document.querySelector(".archive-selector");
  const currentMonth = getCurrentMonthKey();

  // Get all available months
  const months = [currentMonth, ...Object.keys(state.archives)]
    .sort()
    .reverse();

  // Create buttons
  selector.innerHTML =
    '<div class="archive-info">Select a month to view archived transactions</div>';
  months.forEach((month) => {
    const btn = document.createElement("button");
    btn.className =
      "month-button" +
      (month === currentMonth ? " current" : "") +
      (month === state.selectedMonth ? " active" : "");
    btn.textContent = formatMonthLabel(month);
    btn.onclick = () => {
      state.selectedMonth = month === state.selectedMonth ? null : month;
      loadTransactions();
      render();
    };
    selector.appendChild(btn);
  });
};

// Previous utility functions remain the same
const calculateBalance = (transactions) =>
  transactions.reduce(
    (acc, transaction) =>
      transaction.type === "income"
        ? acc + transaction.amount
        : acc - transaction.amount,
    0
  );

const analyzeCategorySpending = (transactions) => {
  return transactions
    .filter((t) => t.type === "expense")
    .reduce((categories, transaction) => {
      categories[transaction.category] =
        (categories[transaction.category] || 0) + transaction.amount;
      return categories;
    }, {});
};

// UI Update Functions (previous ones remain the same)
const updateBalanceDisplay = (balance) => {
  const balanceElement = document.querySelector(".balance-amount");
  balanceElement.textContent = `R${balance.toFixed(2)}`;
  balanceElement.className =
    "balance-amount " + (balance >= 0 ? "income" : "expense");
};

const updateTransactionList = (transactions) => {
  const list = document.querySelector(".transaction-list");
  list.innerHTML = "";
  transactions
    .slice()
    .reverse()
    .forEach((transaction) => {
      const li = document.createElement("li");
      li.className = "transaction-item";
      li.innerHTML = `
                  <div class="transaction-info">
                      <div class="transaction-name">${transaction.name}</div>
                      <div class="transaction-category">${
                        transaction.category
                      }</div>
                  </div>
                  <div class="transaction-amount ${transaction.type}">
                      ${
                        transaction.type === "income" ? "+" : "-"
                      }R${transaction.amount.toFixed(2)}
                  </div>
                  ${
                    !state.selectedMonth
                      ? `
                      <button class="delete-btn" data-id="${transaction.id}">
                          ×
                      </button>
                  `
                      : ""
                  }
              `;
      list.appendChild(li);
    });
};

const updateCategoryAnalysis = (categories) => {
  const categoryStats = document.querySelector(".category-stats");
  categoryStats.innerHTML = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, amount]) => `
                  <div class="category-item">
                      <div class="category-name">${category}</div>
                      <div class="category-amount">R${amount.toFixed(2)}</div>
                  </div>
              `
    )
    .join("");
};

// Main render function
const render = () => {
  updateArchiveSelector();
  const balance = calculateBalance(state.transactions);
  updateBalanceDisplay(balance);
  updateTransactionList(state.transactions);
  updateCategoryAnalysis(analyzeCategorySpending(state.transactions));

  // Hide form when viewing archived months
  const form = document.querySelector(".form-container");
  form.style.display = state.selectedMonth ? "none" : "block";
};

// Event Handlers
const handleSubmit = (e) => {
  e.preventDefault();
  const transaction = {
    id: Date.now(),
    name: document.getElementById("name").value,
    amount: parseFloat(document.getElementById("amount").value),
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    date: new Date().toISOString(),
  };

  state.transactions.push(transaction);
  saveToLocalStorage();
  render();
  e.target.reset();
};

const handleDelete = (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = parseInt(e.target.getAttribute("data-id"));
    state.transactions = state.transactions.filter((t) => t.id !== id);
    saveToLocalStorage();
    render();
  }
};

// Event Listeners
document
  .getElementById("expense-form")
  .addEventListener("submit", handleSubmit);
document
  .querySelector(".transaction-list")
  .addEventListener("click", handleDelete);

// Initialize
loadTransactions();
render();

// Check for month change every minute
setInterval(() => {
  const currentMonth = getCurrentMonthKey();
  if (currentMonth !== state.currentMonth) {
    loadTransactions();
    render();
  }
}, 60000);
