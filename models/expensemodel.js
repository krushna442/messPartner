import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
    Vendor_id: { type: String, required: true },
    expenseData: {
      name: { type: String },
      amount: { type: Number },
      date: { type: Date }
    }
  });
const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
