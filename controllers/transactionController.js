import asyncHandler from "express-async-handler";
import Transaction from "../models/transactionModel.js";
import mongoose from "mongoose";

// @desc    Fetch all transactions for a user
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const { sortBy = "date", order = "desc" } = req.query;
  const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

  const transactions = await Transaction.find({ user: req.user._id }).sort(
    sortOptions
  );
  res.json(transactions);
});

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = asyncHandler(async (req, res) => {
  const { type, category, amount, description, date } = req.body;

  const transaction = new Transaction({
    user: req.user._id,
    type,
    category,
    amount,
    description,
    date,
  });

  const createdTransaction = await transaction.save();
  res.status(201).json(createdTransaction);
});

// @desc    Fetch single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (transaction && transaction.user.toString() === req.user._id.toString()) {
    res.json(transaction);
  } else {
    res.status(404);
    throw new Error("Transaction not found");
  }
});

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  const { type, category, amount, description, date } = req.body;

  const transaction = await Transaction.findById(req.params.id);

  if (transaction && transaction.user.toString() === req.user._id.toString()) {
    transaction.type = type;
    transaction.category = category;
    transaction.amount = amount;
    transaction.description = description;
    transaction.date = date;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } else {
    res.status(404);
    throw new Error("Transaction not found");
  }
});

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (transaction && transaction.user.toString() === req.user._id.toString()) {
    await transaction.deleteOne();
    res.json({ message: "Transaction removed" });
  } else {
    res.status(404);
    throw new Error("Transaction not found");
  }
});

// @desc    Get transactions summary (total income, expenses, balance)
// @route   GET /api/transactions/summary
// @access  Private
const getTransactionsSummary = asyncHandler(async (req, res) => {
  const summary = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
      },
    },
    {
      $group: {
        _id: "$type",
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;

  summary.forEach((item) => {
    if (item._id === "income") {
      totalIncome = item.totalAmount;
    } else if (item._id === "expense") {
      totalExpenses = item.totalAmount;
    }
  });

  const balance = totalIncome - totalExpenses;

  res.json({
    totalIncome,
    totalExpenses,
    balance,
  });
});

// @desc    Get transactions by category for reports
// @route   GET /api/transactions/category-summary
// @access  Private
const getTransactionsByCategory = asyncHandler(async (req, res) => {
  const categorySummary = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
      },
    },
    {
      $group: {
        _id: { category: "$category", type: "$type" },
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id.category",
        type: "$_id.type",
        totalAmount: 1,
      },
    },
  ]);
  res.json(categorySummary);
});

// @desc    Get monthly transactions for reports
// @route   GET /api/transactions/monthly-summary
// @access  Private
const getMonthlyTransactions = asyncHandler(async (req, res) => {
  const { month } = req.query;
  let matchQuery = { user: req.user._id };

  if (month) {
    const [year, monthNum] = month.split("-");
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month
    matchQuery.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const monthlySummary = await Transaction.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
    {
      $project: {
        _id: 0,
        month: {
          $dateToString: {
            format: "%Y-%m",
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1,
              },
            },
          },
        },
        type: "$_id.type",
        totalAmount: 1,
      },
    },
  ]);
  res.json(monthlySummary);
});

export {
  getTransactions,
  addTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
  getTransactionsByCategory,
  getMonthlyTransactions,
};