const express = require("express");
const Item = require("../models/Item");  // Item schema
const router = express.Router();

// =======================
//  GET: Notifications (Low & Out of Stock)
// =======================
router.get("/", async (req, res) => {
  try {
    // Fetch out-of-stock items (quantity <= 0)
    const outOfStockItems = await Item.find({ quantity: { $lte: 0 } });

    // Fetch low-stock items (quantity > 0 but <= 5)
    const lowStockItems = await Item.find({ quantity: { $gt: 0, $lte: 5 } });

    // Return both arrays in the response
    res.status(200).json({
      lowStockItems,
      outOfStockItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching stock notifications",
      error
    });
  }
});

// =======================
//  POST: Restock Item
// =======================
router.post("/", async (req, res) => {
  const { itemId, quantity } = req.body;

  try {
    // Find the item by ID
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // Increment the item quantity
    item.quantity += parseInt(quantity, 10);
    await item.save();

    // Return success response
    res.json({
      success: true,
      message: `${item.name} restocked by ${quantity} units.`,
      updatedItem: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to restock item",
      error
    });
  }
});

// =======================
//  GET: Restock Modal (Fetch Items)
// =======================
router.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find();  // Fetch all items from the database
    if (items.length === 0) {
      return res.status(404).json({ success: false, message: "No items found" });
    }
    res.json(items);  // Send items as JSON response
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching items", error: error.message });
  }
});



module.exports = router;
