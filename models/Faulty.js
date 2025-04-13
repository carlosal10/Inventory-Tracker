const mongoose = require("mongoose");

const faultyItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true },
  dateReturned: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FaultyItem", faultyItemSchema);
