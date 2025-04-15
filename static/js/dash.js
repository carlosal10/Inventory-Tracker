// Loading sales trend chart
let salesTrendChart = null; // Variable to store chart instance
let productAnalysisChart = null; // Variable for pie chart

// Fetch and display dashboard metrics
async function fetchDashboardData() {
  try {
    // Show loading spinner
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    const response = await fetch('/api/dashboard');
    const data = await response.json();

    // Hide loading spinner once data is fetched
    loader.style.display = 'none';

    // Validate the data before rendering
    if (data) {
      document.getElementById('total-items').textContent = data.totalItems || 0;
      document.getElementById('sales-7-days').textContent = data.sales7Days || 0;
      document.getElementById('sales-30-days').textContent = data.sales30Days || 0;
      document.getElementById('products-in-stock').textContent = data.productsInStock || 0;

      // Render Sales Trend Chart
      if (data.salesTrend && Array.isArray(data.salesTrend.dates) && Array.isArray(data.salesTrend.values)) {
        renderSalesTrendChart(data.salesTrend);
      } else {
        console.error("Invalid sales trend data format:", data.salesTrend);
      }

      // Render Product Analysis Chart (Pie Chart)
      if (data.productAnalysis) {
        renderProductAnalysisChart(data.productAnalysis);
      }
    } else {
      throw new Error("No data received");
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    document.getElementById('error-message').textContent = "Failed to load dashboard data. Please try again later.";
  }
}

// Render Sales Trend Chart
function renderSalesTrendChart(salesData = { dates: [], values: [] }) {
  const ctx = document.getElementById('salesTrendChart').getContext('2d');

  // Destroy existing chart instance if it exists
  if (salesTrendChart) {
    salesTrendChart.destroy();
  }

  // Create a new chart instance
  salesTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: salesData.dates,
      datasets: [{
        label: 'Sales Amount',
        data: salesData.values,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Sales Amount' } }
      }
    }
  });
}

// Render Product Analysis Chart (Pie Chart)
function renderProductAnalysisChart(productData = []) {
  const ctx = document.getElementById('productAnalysisChart').getContext('2d');

  // Destroy existing chart instance if it exists
  if (productAnalysisChart) {
    productAnalysisChart.destroy();
  }

  // Create a new pie chart instance
  productAnalysisChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: productData.map(item => item.name),
      datasets: [{
        label: 'Product Analysis',
        data: productData.map(item => item.quantity),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      }],
    },
    options: {
      responsive: true,
    }
  });
}

// Fetch and render sales trend data
async function fetchSalesTrend() {
  try {
    const response = await fetch('/api/sales-trends?period=30');
    if (!response.ok) throw new Error("Failed to fetch sales trend data.");
    const data = await response.json();
    
    if (data.salesTrend && Array.isArray(data.salesTrend.dates) && Array.isArray(data.salesTrend.values)) {
      // Aggregating the sales data by date
      const salesData = aggregateSalesTrendData(data.salesTrend);
      renderSalesTrendChart(salesData);
    } else {
      console.error("Unexpected sales trend data format:", data);
      Swal.fire('Error', 'Failed to process sales trend data.', 'error');
    }
  } catch (error) {
    console.error("Error fetching sales trend data:", error);
  }
}

// Fetch and render top products data
async function fetchTopProducts() {
  try {
    const response = await fetch('/api/top-products');
    if (!response.ok) throw new Error("Failed to fetch top products data.");
    const data = await response.json();
    
    if (data.products && Array.isArray(data.products)) {
      // Aggregating products by category and calculating their total sales
      const aggregatedProducts = aggregateTopProductsByCategory(data.products);
      renderProductAnalysisChart(aggregatedProducts);
    } else {
      console.error("Unexpected top products data format:", data);
      Swal.fire('Error', 'Failed to process top products data.', 'error');
    }
  } catch (error) {
    console.error("Error fetching top products data:", error);
  }
}

// Aggregating sales trend data by date
function aggregateSalesTrendData(salesTrend) {
  const dates = salesTrend.dates;
  const values = salesTrend.values;
  
  const aggregatedSales = dates.reduce((acc, date, index) => {
    const currentDate = new Date(date).toLocaleDateString(); // Format date as string
    if (!acc[currentDate]) {
      acc[currentDate] = 0;
    }
    acc[currentDate] += values[index];
    return acc;
  }, {});

  // Convert aggregated sales into arrays for chart rendering
  const aggregatedDates = Object.keys(aggregatedSales);
  const aggregatedValues = Object.values(aggregatedSales);

  return { dates: aggregatedDates, values: aggregatedValues };
}

// Aggregating products by category
function aggregateTopProductsByCategory(products) {
  const aggregatedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {  // Group by category
      acc[product.category] = { name: product.category, sales: 0 }; 
    }
    acc[product.category].sales += product.sales;  // Sum the sales for each category
    return acc;
  }, {});

  // Convert the aggregated products into an array for chart rendering
  return Object.values(aggregatedProducts);
}

  // Handle selling an item with a styled form
  async function sellItem(itemId) {
    const formHtml = `
      <style>
        /* Form Container Styling */
#sellForm {
  background-color: rgba(0, 0, 0, 0.8);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 0 25px rgba(0, 140, 255, 0.7);
  max-width: 400px;
  margin: 20px auto;
  font-family: 'Arial', sans-serif;
  color: #fff;
  transition: all 0.3s ease;
}

/* Form Title Styling */
#sellForm h2 {
  color: #00e6ff;
  font-size: 2em;
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: glow 1.5s infinite alternate;
}

/* Glow Animation for H2 */
@keyframes glow {
  0% {
    text-shadow: 0 0 10px #00e6ff, 0 0 20px #00e6ff, 0 0 30px #00e6ff, 0 0 40px #00e6ff;
  }
  100% {
    text-shadow: 0 0 20px #00e6ff, 0 0 30px #00e6ff, 0 0 40px #00e6ff, 0 0 50px #00e6ff;
  }
}

/* Label Styling */
#sellForm label {
  display: block;
  color: #00e6ff;
  margin-top: 15px;
  font-size: 1.1em;
  text-shadow: 0 0 5px #00e6ff, 0 0 10px #00e6ff;
}

/* Input Fields Styling */
#sellForm input, 
#sellForm select {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  border: 2px solid #008cff;
  border-radius: 10px;
  background-color: #222;
  color: #fff;
  font-size: 1em;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

#sellForm input:focus, 
#sellForm select:focus {
  border-color: #00e6ff;
  outline: none;
  box-shadow: 0 0 8px rgba(0, 140, 255, 0.6);
}

/* Placeholder Text Styling */
#sellForm input::placeholder {
  color: #ccc;
}

/* Submit Button Styling */
#sellForm button {
  background-color: #00e6ff;
  color: #fff;
  border: 2px solid #008cff;
  padding: 12px 20px;
  font-size: 16px;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  margin-top: 20px;
}

#sellForm button:hover {
  background-color: #008cff;
  box-shadow: 0 0 15px rgba(0, 140, 255, 0.8);
  transform: scale(1.05);
}

/* Responsive Design */
@media (max-width: 768px) {
  #sellForm {
    width: 90%;
  }
}

      </style>
      <form id="sellForm">
        <label for="quantity">Quantity to Sell</label>
        <input type="number" id="quantity" placeholder="Enter quantity" required />
        
        <label for="soldPrice">Selling Price</label>
        <input type="number" id="soldPrice" placeholder="Enter price" required />
        
        <label for="discount">Discount</label>
        <input type="number" id="discount" placeholder="Optional discount" />
        
        <label for="paymentMethod">Payment Method</label>
        <select id="paymentMethod" required>
          <option value="" disabled selected>Select payment method</option>
          <option value="cash">Cash</option>
          <option value="paybill">Paybill</option>
        </select>
      </form>
    `;
  
    const sellData = await Swal.fire({
      title: "Enter Sale Details",
      html: formHtml,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Sell",
      preConfirm: () => {
        const quantity = parseInt(document.getElementById("quantity").value, 10);
        const soldPrice = parseFloat(document.getElementById("soldPrice").value);
        const discount = parseFloat(document.getElementById("discount").value);
        const paymentMethod = document.getElementById("paymentMethod").value;
  
        if (quantity <= 0 || soldPrice <= 0 || !paymentMethod) {
          Swal.showValidationMessage("Please enter valid quantity, price, and payment method.");
          return false;
        }
  
        return { quantity, soldPrice, discount: isNaN(discount) ? 0 : discount, paymentMethod };
      },
    });
  
    if (sellData.isConfirmed) {
      const { quantity, soldPrice, discount, paymentMethod } = sellData.value;
  
      try {
        const response = await fetch("/api/sell-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity, soldPrice, discount, paymentMethod }),
        });
  
        const result = await response.json();
        if (response.ok) {
          Swal.fire("Success!", result.message, "success");
          // Reload items list
        } else {
          Swal.fire("Error", result.error || "Failed to sell item.", "error");
        }
      } catch (error) {
        console.error("Error selling item:", error);
        Swal.fire("Error", "Failed to sell item.", "error");
      }
    }
  }
 
  
  async function fetchNotifications() {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      console.log("Notification Data:", data);  // Debugging log
  
      if (response.ok) {
        displayNotifications(data);
      } else {
        console.error("Failed to fetch notifications:", data.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }
  
  function displayNotifications(data) {
    const notificationArea = document.getElementById("notificationArea");
    notificationArea.innerHTML = "";  // Clear previous notifications
  
    let hasNotifications = false;
  
    // Out of Stock
    data.outOfStockItems.forEach(item => {
      const div = createNotificationDiv(
        `❌ Out of Stock: <strong>${item.name}</strong>`,
        'out-of-stock',
        item._id
      );
      notificationArea.appendChild(div);
      hasNotifications = true;
    });
  
    // Low Stock
    data.lowStockItems.forEach(item => {
      const div = createNotificationDiv(
        `⚠️ Low Stock: <strong>${item.name}</strong> - <span>${item.quantity} left</span>`,
        'low-stock',
        item._id
      );
      notificationArea.appendChild(div);
      hasNotifications = true;
    });
  
    // No Notifications
    if (!hasNotifications) {
      const div = createNotificationDiv(
        "✔️ All items are well stocked.",
        'no-alerts'
      );
      notificationArea.appendChild(div);
    }
  }
  
  // Create Notification Div (Updated)
  function createNotificationDiv(message, type, itemId = null) {
    const div = document.createElement("div");
    div.className = `notification-alert ${type}`;
    div.innerHTML = `${message} 
      ${itemId ? `<button onclick="openRestockModal('${itemId}')">Restock</button>` : ''}
      <button class="close-btn" onclick="dismissNotification(this)">✖</button>`;
  
    // Auto-remove after 7 seconds
    setTimeout(() => {
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }, 7000);  // 7 seconds
  
    return div;
  }
  
  
  // Helper Function to Create Notification Div with Close Button
  function createNotificationDiv(message, type) {
    const div = document.createElement("div");
    div.className = `notification-alert ${type}`;
    div.innerHTML = `${message} <button class="close-btn" onclick="dismissNotification(this)">✖</button>`;
  
    // Auto-remove after 7 seconds
    setTimeout(() => {
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }, 7000);  // 7 seconds
  
    return div;
  }
  
  // Dismiss Notification Manually
  function dismissNotification(button) {
    const notification = button.parentElement;
    notification.style.opacity = 0;  // Fade effect
    setTimeout(() => notification.remove(), 500);  // Remove after fade
  }
  
  
  // Create notification alert with a restock button
  function createNotificationAlert(item, message, type) {
    const alert = document.createElement("div");
    alert.className = `notification-alert ${type}`;
    alert.innerHTML = `${message}: <strong>${item.name}</strong> 
      <button onclick="restockItem('${item._id}')">Restock</button>`;
    return alert;
  }
  
  
  
  // Auto-refresh notifications every 30 seconds
  setInterval(fetchNotifications, 30000);  
  document.addEventListener("DOMContentLoaded", fetchNotifications);
  



// Function to search items
async function searchItems() {
  const query = document.getElementById("searchInput").value;

  if (!query) {
    alert("Please enter a search term.");
    return;
  }

  try {
    const response = await fetch(`/api/search-items?query=${encodeURIComponent(query)}`);
    const results = await response.json();
    displaySearchResults(results);
  } catch (error) {
    console.error("Error searching items:", error);
  }
}

// Function to display search results
function displaySearchResults(items) {
  const tableBody = document.getElementById("searchResultsBody");
  tableBody.innerHTML = ""; // Clear previous results

  items.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.serialNumber}</td>
      <td>${item.quantity}</td>
      <td>${item.sellingPrice}</td>
       <td><button onclick="sellItem('${item._id}')">Sell</button></td>
    `;
    tableBody.appendChild(row);
  });
}

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  // Load the saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.checked = true;
  }

  // Listen for theme toggle changes
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark'); // Save preference
    } else {
      body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light'); // Save preference
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
// Initialize data fetching on page load
window.onload = () => {
  fetchDashboardData();
  fetchSalesTrend();
  fetchTopProducts();
  fetchNotifications();
};
});


