const mongoose = require('mongoose');

const loanPaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, default: Date.now },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
}, { _id: true });

const loanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  borrower: { type: String, required: true, trim: true, maxlength: 100 },
  concept: { type: String, required: true, trim: true, maxlength: 140 },
  originalAmount: { type: Number, required: true, min: 0.01 },
  outstandingAmount: { type: Number, required: true, min: 0 },
  startDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue'], default: 'pending' },
  notes: { type: String, trim: true, maxlength: 500 },
  payments: [loanPaymentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
