const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  name: String,
  phone: String,
  paymentMode: String,
  date: Date,
  amount: Number,
});

const expenseSchema = new mongoose.Schema({
  notes: String,
  date: Date,
  amount: Number,
});

const recordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: Date,
  data: [dataSchema], // ✅ renamed to 'data'
  expenses: [expenseSchema],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Record", recordSchema);
