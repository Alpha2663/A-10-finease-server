import express from "express";
const router = express.Router();
import {
  getTransactions,
  addTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
  getTransactionsByCategory,
  getMonthlyTransactions,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/").get(protect, getTransactions).post(protect, addTransaction);
router.route("/summary").get(protect, getTransactionsSummary);
router.route("/category-summary").get(protect, getTransactionsByCategory);
router.route("/monthly-summary").get(protect, getMonthlyTransactions);
router
  .route("/:id")
  .get(protect, getTransactionById)
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

export default router;
