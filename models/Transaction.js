import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // income | expense
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    email: { type: String, required: true },
    name: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
