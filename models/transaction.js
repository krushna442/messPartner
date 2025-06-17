import mongoose from 'mongoose';


const TransactionSchema = new mongoose.Schema({
  Vendor_id: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    
    enum: [
      'order_payment', 
      'subscription_payment',
      'delivery_salary',
      'kitchen_staff',
      'grocery_purchase',
      'electricity_bill',
      'gas_refill',
      'rent',
      'other'
    ],
  },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'completed' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['upi', 'cash', 'bank_transfer', 'card', 'wallet'], 
    required: true 
  },
  attachment: { type: String }, // URL to proof/document
  date: { type: Date, default: Date.now },
  recipient: { // For payouts
    name: String,
    type: { type: String, enum: ['staff', 'supplier', 'other'] },
    accountDetails: mongoose.Schema.Types.Mixed
  }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
export default Transaction;