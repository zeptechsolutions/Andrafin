const mongoose = require('mongoose');

const receivablePaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, default: Date.now },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true }
}, { _id: true });

const receivableSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  payer: { type: String, required: true, trim: true, maxlength: 100 },
  concept: { type: String, required: true, trim: true, maxlength: 140 },
  originalAmount: { type: Number, required: true, min: 0.01 },
  outstandingAmount: { type: Number, required: true, min: 0 },
  expectedDate: { type: Date, index: true },
  status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue'], default: 'pending', index: true },
  notes: { type: String, trim: true, maxlength: 500 },
  payments: [receivablePaymentSchema]
}, { timestamps: true });

receivableSchema.index({ user: 1, status: 1, expectedDate: 1 });

module.exports = mongoose.model('Receivable', receivableSchema);
