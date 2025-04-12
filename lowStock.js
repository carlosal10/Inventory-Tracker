const express = require("express");
const Item = require("../models/Item");  // Assuming Item schema is already defined
const router = express.Router();

// Fetch out-of-stock and low-stock items
router.get("/", async (req, res) => {
  try {
    const threshold = 5;

    // Fetch items below threshold
    const lowStockItems = await Item.find({ quantity: { $lte: threshold, $gt: 0 } });
    
    // Fetch out-of-stock items (quantity = 0)
    const outOfStockItems = await Item.find({ quantity: 0 });

    res.status(200).json({ lowStockItems, outOfStockItems });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

module.exports = router;

