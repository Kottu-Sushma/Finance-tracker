document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const transactionForm = document.getElementById('transactionForm');
    const transactionList = document.getElementById('transactionList');
    const balanceElement = document.getElementById('balance');
    const incomeElement = document.getElementById('total-income');
    const expenseElement = document.getElementById('total-expense');
    
    // Set today's date as default
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    // Format currency in Indian Rupees
    function formatRupees(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    // Initialize monthly chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    const monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Income',
                    data: [65000, 72000, 68000, 75000, 82000, 78000, 85000, 80000, 83000, 87000, 82000, 90000],
                    borderColor: '#34c38f',
                    backgroundColor: 'rgba(52, 195, 143, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: [42000, 45000, 47000, 43000, 48000, 50000, 52000, 49000, 51000, 53000, 55000, 58000],
                    borderColor: '#f46a6a',
                    backgroundColor: 'rgba(244, 106, 106, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Savings',
                    data: [23000, 27000, 21000, 32000, 34000, 28000, 33000, 31000, 32000, 34000, 27000, 32000],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatRupees(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
    
    // Add transaction
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('transactionName').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const type = document.getElementById('transactionType').value;
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        
        if (name.trim() === '' || isNaN(amount)) {
            alert('Please enter valid details');
            return;
        }
        
        const transaction = {
            id: generateID(),
            name,
            amount,
            type,
            category,
            date
        };
        
        transactions.push(transaction);
        updateLocalStorage();
        updateUI();
        transactionForm.reset();
        document.getElementById('transactionDate').valueAsDate = new Date();
    });
    
    // Generate unique ID
    function generateID() {
        return Math.floor(Math.random() * 1000000000);
    }
    
    // Update localStorage
    function updateLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    // Update UI
    function updateUI() {
        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Clear transaction list
        transactionList.innerHTML = '';
        
        // Add transactions to list
        if (transactions.length === 0) {
            transactionList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <h3>No transactions yet</h3>
                    <p>Add your first transaction to get started</p>
                </div>
            `;
        } else {
            // Only show the last 10 transactions
            const recentTransactions = transactions.slice(0, 10);
            
            recentTransactions.forEach(transaction => {
                const item = document.createElement('div');
                item.classList.add('transaction-item');
                item.classList.add(transaction.type === 'income' ? 'income-item' : 'expense-item');
                
                item.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-name">${transaction.name}</div>
                        <div class="transaction-category">
                            <i class="fas fa-${getCategoryIcon(transaction.category)}"></i>
                            ${getCategoryName(transaction.category)}
                        </div>
                        <div class="transaction-date">${formatDate(transaction.date)}</div>
                    </div>
                    <div class="transaction-amount ${transaction.type === 'income' ? 'income-amount' : 'expense-amount'}">
                        ${transaction.type === 'income' ? '+' : '-'}${formatRupees(transaction.amount)}
                    </div>
                    <button class="delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
                
                transactionList.appendChild(item);
            });
        }
        
        // Update totals
        updateTotals();
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteTransaction(id);
            });
        });
    }
    
    // Delete transaction
    function deleteTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateLocalStorage();
        updateUI();
    }
    
    // Update totals
    function updateTotals() {
        const amounts = transactions.map(transaction => 
            transaction.type === 'income' ? transaction.amount : -transaction.amount
        );
        
        const total = amounts.reduce((acc, item) => (acc += item), 0);
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => (acc += t.amount), 0);
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => (acc += t.amount), 0);
        
        balanceElement.textContent = formatRupees(total);
        incomeElement.textContent = formatRupees(income);
        expenseElement.textContent = formatRupees(expense);
    }
    
    // Get category name
    function getCategoryName(category) {
        const names = {
            'salary': 'Salary',
            'business': 'Business',
            'investment': 'Investment',
            'food': 'Food & Dining',
            'shopping': 'Shopping',
            'transport': 'Transportation',
            'entertainment': 'Entertainment',
            'bills': 'Bills & Utilities',
            'emi': 'EMI',
            'other': 'Other'
        };
        
        return names[category] || category;
    }
    
    // Get category icon
    function getCategoryIcon(category) {
        const icons = {
            'salary': 'money-check',
            'business': 'briefcase',
            'investment': 'chart-line',
            'food': 'utensils',
            'shopping': 'shopping-cart',
            'transport': 'car',
            'entertainment': 'film',
            'bills': 'lightbulb',
            'emi': 'home',
            'other': 'tag'
        };
        
        return icons[category] || 'tag';
    }
    
    // Format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    }
    
    // Initialize UI
    updateUI();
});