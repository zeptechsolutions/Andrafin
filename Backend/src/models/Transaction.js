const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'extra', 'transfer', 'debt_payment', 'loan_given', 'loan_repayment', 'receivable_payment']
  },
  amount: { type: Number, required: true, min: 0.01 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  destinationAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  concept: { type: String, required: true, trim: true, maxlength: 140 },
  notes: { type: String, trim: true, maxlength: 500 },
  date: { type: Date, default: Date.now, index: true },
  sourceModel: { type: String, enum: ['Debt', 'Loan', 'Receivable', 'RecurringTransaction', null], default: null },
  sourceId: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });
module.exports = mongoose.model('Transaction', transactionSchema);
