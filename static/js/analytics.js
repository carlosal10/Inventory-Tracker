document.addEventListener("DOMContentLoaded", function () {
    // Fetch analytics data from the backend
    fetch("http://localhost:3000/api/analytics")
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const { totalSales, totalProfit, profitMargin, salesTrends } = data.data;
  
          // Update profit and loss details
          document.getElementById('total-sales').innerText = totalSales.toFixed(2);
          document.getElementById('total-profit').innerText = totalProfit.toFixed(2);
          document.getElementById('profit-margin').innerText = profitMargin.toFixed(2);
  
          // Prepare data for Sales Trends chart
          const labels = salesTrends.map(item => `${item._id.month}/${item._id.year}`);
          const salesData = salesTrends.map(item => item.totalSales);
  
          // Create the Sales Trends chart
          const ctx = document.getElementById('sales-trends-chart').getContext('2d');
          const salesChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'Total Sales',
                data: salesData,
                borderColor: 'rgb(75, 192, 192)',
                fill: false,
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                tooltip: {
                  callbacks: {
                    label: function(tooltipItem) {
                      return `$${tooltipItem.raw.toFixed(2)}`;
                    }
                  }
                }
              }
            }
          });
        } else {
          alert("Failed to load analytics data.");
        }
      })
      .catch(error => console.error("Error fetching analytics data:", error));
  });
  