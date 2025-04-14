const express = require("express"); 
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Item = require("./models/Item");
const SoldItem = require("./models/SoldItem");
const path = require('path');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const fs = require('fs');



// Initialize the Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.Router());

// Set up the MongoDB connection
// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/inventoryDB", {
  
  })
  .then(async () => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Routes (Example route to confirm server is running)
app.get("/", (req, res) => {
  res.send("Server is running.");


});
const hash = bcrypt.hashSync(password, 10);
const isMatch = bcrypt.compareSync(password, hash);



const { router: registerRoutes} = require("./routes/Register");
const faultyItemRoutes = require('./routes/FaultyItems');
const loginRoutes = require("./routes/Login");
const itemRoutes = require("./routes/Items");
const restockRoutes = require("./routes/restock");
const notificationRoutes = require("./routes/lowStock");

app.use("/api/notifications", notificationRoutes);
app.use("/api/restock", restockRoutes);
app.use("/api/register", registerRoutes);
app.use('/api/faulty-items', faultyItemRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/add-item", itemRoutes);


function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "Access denied." });

  jwt.verify(token, "your_jwt_secret", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user; // Attach user info to the request
    next();
  });
}

module.exports = authenticateToken;





// Sell Item Route
app.post("/api/sell-item", async (req, res) => {
  const { itemId, quantity, soldPrice, discountApplied, paymentMethod } = req.body;

  try {
    // Check if all fields are provided
    if (!itemId || !quantity || !soldPrice || !paymentMethod) {
      return res.status(400).json({ error: "Item ID, quantity, price, and payment method are required." });
    }

    // Validate payment method
    const validPaymentMethods = ["cash", "paybill"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method. Use 'cash' or 'paybill'." });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.quantity < quantity) return res.status(400).json({ error: "Not enough stock to sell" });

    // Ensure discount does not exceed max limit
    if (discountApplied && discountApplied > item.maxDiscount) {
      return res.status(400).json({ error: `Discount exceeds allowed limit of ${item.maxDiscount}` });
    }

    const effectiveSellingPrice = soldPrice - (discountApplied || 0);
    const profitOrLoss = (effectiveSellingPrice - item.buyingPrice) * quantity;

    // Reduce stock
    item.quantity -= quantity;
    await item.save();

    // Create new SoldItem entry
    const soldItem = new SoldItem({
      itemId: item._id,
      name: item.name,
      category: item.category,
      serialNumber: item.serialNumber,
      quantity,
      soldPrice: effectiveSellingPrice,
      discountApplied,
      buyingPrice: item.buyingPrice,
      profitOrLoss,
      paymentMethod, // Save payment method
    });
    await soldItem.save();

    res.json({ message: "Item sold successfully.", profitOrLoss, updatedStock: item.quantity });
  } catch (error) {
    console.error("Error processing sale:", error);
    res.status(500).json({ error: "Failed to process sale" });
  }
});



// Dashboard Data Route
app.get("/api/dashboard", async (req, res) => {
  try {
    // Fetch total items count
    const totalItems = await Item.countDocuments({});

    // Fetch products in stock (sum of all quantities)
    const productsInStock = await Item.aggregate([
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    // Dates for last 7 and 30 days
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    // Fetch sales for the last 7 and 30 days
    const sales7Days = await SoldItem.countDocuments({ createdAt: { $gte: last7Days } });
    const sales30Days = await SoldItem.countDocuments({ createdAt: { $gte: last30Days } });

    // Fetch sales trend data (group by date for the last 7 days)
    const salesTrend = await SoldItem.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // Example of product analysis (simplified)
    const productAnalysis = await Item.aggregate([
      { $group: { _id: "$name", quantity: { $sum: "$quantity" } } }
    ]);

    // Prepare the sales trend data
    const trendData = {
      dates: salesTrend.map(data => data._id),
      values: salesTrend.map(data => data.count),
    };

    res.json({
      totalItems,
      sales7Days,
      sales30Days,
      productsInStock: productsInStock[0]?.total || 0,
      salesTrend: trendData,
      productAnalysis,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});



app.get("/api/get-items", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const items = await Item.find().skip(skip).limit(limit);
    const totalItems = await Item.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    res.setHeader("Content-Type", "application/json"); // Explicitly set content type
    res.status(200).json({ items, totalItems, totalPages, page });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ error: "Internal server error" });
  }
});




app.get('/api/sales-trends', async (req, res) => {
  try {
    const period = req.query.period || '30'; // Default to 30 days if no period is provided
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    const sales = await SoldItem.aggregate([
      { 
        $match: { 
          dateSold: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateSold" } },
          totalSales: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } } // Sort by date (ascending)
    ]);

    console.log("Sales data retrieved:", sales);

    // Prepare the sales trend data
    const salesTrend = {
      dates: sales.map(sale => sale._id), // Group by date
      values: sales.map(sale => sale.totalSales) // Sum of sales for each date
    };

    res.json({ salesTrend });
  } catch (error) {
    console.error("Error fetching sales trends:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Top Products Route
app.get('/api/top-products', async (req, res) => {
  try {
    const topProducts = await SoldItem.aggregate([
      {
        $group: {
          _id: "$category", // Group by itemId
          totalSales: { $sum: 1 } // Sum the total sales for each item
        }
      },
      {
        $lookup: {
          from: 'items', // Join with the items collection to get product details
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: "$category" },
      {
        $project: {
          name: "$category.name", // Get the product name
          category: "$productInfo.category", // Get the product category
          sales: "$totalSales" // Sales count
        }
      },
      { $sort: { sales: -1 } }, // Sort by sales count in descending order
      { $limit: 5 } // Limit to top 5 products
    ]);

    console.log("Top products retrieved:", topProducts);

    // Group top products by category
    const aggregatedProducts = topProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = { name: product.category, sales: 0 };
      }
      acc[product.category].sales += product.sales; // Aggregate sales by category
      return acc;
    }, {});

    // Convert aggregated products into an array for chart rendering
    const products = Object.values(aggregatedProducts);

    res.json({ products });
  } catch (error) {
    console.error("Error fetching product analysis:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search Items Route
app.get("/api/search-items", async (req, res) => {
const { query } = req.query;

try {
const searchResults = await Item.find({
  $or: [
    { name: { $regex: query, $options: "i" } },       // Case-insensitive search by name
    { category: { $regex: query, $options: "i" } },   // Case-insensitive search by category
    { serialNumber: { $regex: query, $options: "i" } } // Case-insensitive search by serial number
  ]
});

res.json(searchResults);
} catch (error) {
console.error("Error searching items:", error);
res.status(500).json({ error: "Failed to search items" });
}
});




app.get("/api/analytics", async (req, res) => {
try {
// Calculate total sales, total profit, and profit margin
const items = await Item.find();

// Calculate total sales and profit for each item
let totalSales = 0;
let totalProfit = 0;
items.forEach(item => {
  totalSales += item.sellingPrice * item.quantity;
  totalProfit += (item.sellingPrice - item.buyingPrice) * item.quantity;
});

// Calculate profit margin
const profitMargin = (totalProfit / totalSales) * 100;

// Sales trends - you can adjust this to group by week/month depending on your data
const salesTrends = await getSalesTrends(); // A helper function that aggregates sales data

res.json({
  success: true,
  data: {
    totalSales,
    totalProfit,
    profitMargin,
    salesTrends
  }
});
} catch (error) {
console.error("Error fetching analytics data:", error);
res.status(500).json({ success: false, message: "Failed to fetch analytics" });
}
});

// Helper function to get sales trends (you can group by days, weeks, or months)
async function getSalesTrends() {
// Aggregate sales data by date, week, or month here
const salesData = await Item.aggregate([
{
  $project: {
    month: { $month: "$purchaseDate" },
    year: { $year: "$purchaseDate" },
    totalSales: { $multiply: ["$sellingPrice", "$quantity"] },
  }
},
{
  $group: {
    _id: { month: "$month", year: "$year" },
    totalSales: { $sum: "$totalSales" }
  }
},
{
  $sort: { "_id.year": 1, "_id.month": 1 }  // Sort by date
}
]);

return salesData;
}

// Backend: Fetch individual sold items
app.get('/api/sold-items', async (req, res) => {
  try {
    const soldItems = await SoldItem.find(); // Fetch individual sold items
    res.json(soldItems);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching data', error: err });
  }
});


// Backend: Express API endpoint to fetch sold items and group by category
app.get('/api/sold-items', async (req, res) => {
try {
const soldItems = await SoldItem.aggregate([
  {
    $group: {
      _id: '$category', // Group by category name
      totalSold: { $sum: '$quantity' },  // Total quantity sold per category
      totalRevenue: { $sum: '$soldPrice' },  // Total revenue per category
      totalProfit: { $sum: '$profitOrLoss' }  // Total profit per category
    }
  }
]);
res.json(soldItems);
} catch (err) {
res.status(500).json({ message: 'Error fetching data', error: err });
}
});


app.use(express.static('public'));
// Serve static files from a single directory
app.use(express.static(path.join(__dirname, "static")));

// Serve specific HTML files for routes
app.get("/dash", (req, res) => {
  res.sendFile(path.join(__dirname, "dash.html"));
});

app.get("/inventory-view", (req, res) => {
  res.sendFile(path.join(__dirname, "inventory-view.html"));
});

app.get("/analytics", (req, res) => {
  res.sendFile(path.join(__dirname, "Analytics.html"));
});

app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "User.html"));
});

// Default route for "/" (Regs.html or index.html, choose one)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Regs.html"));
});

// Catch-all route for serving HTML files (ensure this is the last route)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "Lander.html"));
});
console.log("Serving static files and HTML from:", __dirname);




// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
