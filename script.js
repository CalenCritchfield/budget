// State management
const state = {
  transactions: JSON.parse(localStorage.getItem("transactions")) || [],
};

// Utility functions
const saveToLocalStorage = () => {
  localStorage.setItem("transactions", JSON.stringify(state.transactions));
};

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

// UI Update Functions
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
                          <div class="transaction-name">${
                            transaction.name
                          }</div>
                          <div class="transaction-category">${
                            transaction.category
                          }</div>
                      </div>
                      <div class="transaction-amount ${transaction.type}">
                          ${
                            transaction.type === "income" ? "+" : "-"
                          }R${transaction.amount.toFixed(2)}
                      </div>
                      <button class="delete-btn" data-id="${transaction.id}">
                          ×
                      </button>
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
                          <div class="category-amount">R${amount.toFixed(
                            2
                          )}</div>
                      </div>
                  `
    )
    .join("");
};

// Main render function
const render = () => {
  const balance = calculateBalance(state.transactions);
  updateBalanceDisplay(balance);
  updateTransactionList(state.transactions);
  updateCategoryAnalysis(analyzeCategorySpending(state.transactions));
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

// Initial render
render();
