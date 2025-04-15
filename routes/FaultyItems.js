const express = require("express");
const FaultyItem = require("../models/Faulty");
const router = express.Router();

// POST - Add Faulty Item
router.post('/', async (req, res) => {
    const { name, quantity, reason } = req.body;

    if (!name || !quantity || !reason) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const newItem = new FaultyItem({ name, quantity, reason });
        await newItem.save();
        res.json({ success: true, message: 'Faulty item added!', item: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving item', error });
    }
});

// GET - Fetch All Faulty Items
router.get('/', async (req, res) => {
    try {
        const items = await FaultyItem.find();  // Fetch from DB
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Error fetching faulty items', error });
    }
});

// Faulty items with pagination
router.get('/faulty-items', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
  
    try {
      const totalItems = await FaultyItem.countDocuments(); // Total faulty items
      const faultyItems = await FaultyItem.find()
        .skip(skip)
        .limit(limit);
  
      res.json({
        data: faultyItems,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching faulty items', error });
    }
  });
  
// Assuming you're using Express and MongoDB
router.get('/sold-items', async (req, res) => {
    const page = parseInt(req.query.page) || 1;  // Default to page 1
    const limit = parseInt(req.query.limit) || 10;  // Default to 10 items per page
    const skip = (page - 1) * limit;
  
    try {
      const totalItems = await SoldItem.countDocuments(); // Total sold items
      const soldItems = await SoldItem.find()
        .skip(skip)
        .limit(limit);
  
      res.json({
        data: soldItems,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching sold items', error });
    }
  });
  
module.exports = router;


