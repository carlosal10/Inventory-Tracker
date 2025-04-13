const mongoose = require("mongoose");

// SoldItem Schema
const soldItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  name: String,
  category: String,
  serialNumber: String,
  quantity: Number,
  soldPrice: Number,  // Actual price sold
  discountApplied: Number, // Discount applied during sale
  buyingPrice: Number, // Buying price at time of sale
  profitOrLoss: Number, // Calculated profit or loss
  paymentMethod: { type: String, enum: ['cash', 'paybill'], required: true }, // Payment method used
  dateSold: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const SoldItem = mongoose.model("SoldItem", soldItemSchema);
module.exports = SoldItem;
