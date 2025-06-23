const express = require("express");
const Record = require("../models/Record");
const jwt = require("jsonwebtoken");

const router = express.Router();
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token." });
  }
};
//POST: Create a new record
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { name, date } = req.body;
    const userId = req.user.id;

    const newRecord = new Record({ name, date, user: userId });
    await newRecord.save();

    console.log("Creating record for user:", req.user); // should include `id`
    console.log("Record data:", req.body);

    res.status(201).json(newRecord);
  } catch (err) {
    console.error("Record creation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET: Fetch records for logged in user
router.get("/my-records", verifyToken, async (req, res) => {
  try {
    const records = await Record.find({ user: req.user.id }).sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE: Delete a record by ID
router.delete("/:recordId", verifyToken, async (req, res) => {
  try {
    const deletedRecord = await Record.findOneAndDelete({
      _id: req.params.recordId,
      user: req.user.id, // ensure users can only delete their own records
    });

    if (!deletedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add data to a specific record
// POST: Add data to a record
router.post("/:id/data", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const newData = req.body;

    const record = await Record.findById(id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    record.data.push(newData);
    await record.save();

    res.status(201).json(record);
  } catch (err) {
    console.error("Add data error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE: Delete specific data from a record
router.delete("/:recordId/data/:dataId", verifyToken, async (req, res) => {
  try {
    const { recordId, dataId } = req.params;

    const record = await Record.findById(recordId);
    if (!record) return res.status(404).json({ message: "Record not found" });

    record.data = record.data.filter((item) => item._id.toString() !== dataId);
    await record.save();

    res.status(200).json({ message: "Data deleted successfully" });
  } catch (err) {
    console.error("Delete data error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Add expense to a record
router.post("/:id/add-expense", verifyToken, async (req, res) => {
  try {
    const { notes, amount, date } = req.body;
    const record = await Record.findById(req.params.id);

    if (!record) return res.status(404).json({ message: "Record not found" });

    record.expenses.push({ notes, amount, date });
    await record.save();

    res.status(201).json(record);
  } catch (err) {
    console.error("Add expense error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an expense
router.delete(
  "/:recordId/expenses/:expenseId",
  verifyToken,
  async (req, res) => {
    try {
      const record = await Record.findOne({
        _id: req.params.recordId,
        user: req.user.id,
      });
      if (!record) return res.status(404).json({ message: "Record not found" });

      record.expenses = record.expenses.filter(
        (e) => e._id.toString() !== req.params.expenseId
      );
      await record.save();
      res.status(200).json({ message: "Expense deleted successfully", record });
    } catch (err) {
      console.error("Error deleting expense:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get full record details
router.get("/:recordId", verifyToken, async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.recordId,
      user: req.user.id,
    });
    if (!record) return res.status(404).json({ message: "Record not found" });

    res.status(200).json(record);
  } catch (err) {
    console.error("Error getting record details:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
