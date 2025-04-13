const express = require('express');
const Item = require('../models/Item'); // Assuming you have an Item model
const router = express.Router();

// In-memory cache to hold data temporarily
let itemCache = []; 

// POST - Add or Update Item
router.post('/', async (req, res) => {
  const { name, category, serialNumber, quantity, buyingPrice, sellingPrice, purchaseDate, condition, maxDiscount, isDiscounted } = req.body;

  try {
    // Check if item already exists by serial number
    const existingItem = await Item.findOne({ serialNumber });
    if (existingItem) {
      // If item exists, update it instead of adding a new one
      existingItem.name = name;
      existingItem.category = category;
      existingItem.quantity = quantity;
      existingItem.buyingPrice = buyingPrice;
      existingItem.sellingPrice = sellingPrice;
      existingItem.purchaseDate = purchaseDate;
      existingItem.condition = condition;
      existingItem.maxDiscount = isDiscounted ? maxDiscount : 0;
      existingItem.isDiscounted = isDiscounted;

      await existingItem.save(); // Save updated item to database

      // Update the cache (replace the old item with the updated one)
      const cacheIndex = itemCache.findIndex(item => item.serialNumber === serialNumber);
      if (cacheIndex !== -1) {
        itemCache[cacheIndex] = existingItem; // Update cache with new item data
      }

      return res.json({ success: true, message: "Item updated successfully!" });
    }

    // If the item doesn't exist, proceed with adding it
    let discountValue = isDiscounted ? maxDiscount : 0;

    if (isDiscounted && (isNaN(discountValue) || discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ success: false, message: "Invalid maxDiscount value. It should be between 0 and 100." });
    }

    const newItem = new Item({
      name,
      category,
      serialNumber,
      quantity,
      buyingPrice,
      sellingPrice,
      purchaseDate,
      condition,
      maxDiscount: discountValue,
      isDiscounted,
    });

    await newItem.save(); // Save to MongoDB
    itemCache.push(newItem); // Add the newly added item to cache

    res.json({ success: true, message: "Item added successfully!" });

  } catch (error) {
    console.error("Error adding/updating item:", error);
    res.status(500).json({ success: false, message: "Failed to add/update item" });
  }
});

// GET - Fetch items (from cache or DB)
router.get('/api/items', async (req, res) => {
  if (itemCache.length > 0) {
    return res.json(itemCache); // Return items from cache if available
  }

  // If no cached data, fetch from MongoDB
  try {
    const items = await Item.find();
    res.json(items); // Return items from DB if cache is empty
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items from database" });
  }
});

// Sync cache to DB every minute (optional - if you're using an in-memory cache)
setInterval(async () => {
  try {
    for (const cachedItem of itemCache) {
      const existingItem = await Item.findOne({ serialNumber: cachedItem.serialNumber });
      if (!existingItem) {
        const newItem = new Item(cachedItem);
        await newItem.save();
      }
    }
  } catch (error) {
    console.error("Error syncing cache to database:", error);
  }
}, 60000); // Sync every 1 minute

module.exports = router;
