import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
    Vendor_id: { type:String, required: true },
    expenseData: { type: mongoose.Schema.Types.Mixed, required: true }, // Stores dynamic data
    date: { type: Date, default: Date.now } // Timestamp for tracking
});

const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
