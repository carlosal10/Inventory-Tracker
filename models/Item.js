const mongoose = require("mongoose");

// Item Schema
const itemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  buyingPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  maxDiscount: Number, // Maximum discount allowed
  category: String,
  serialNumber: String,
  isDiscounted: { type: String, default: "Yes" }, // Set "Yes" by default
  createdAt: { type: Date, default: Date.now }
});


const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
