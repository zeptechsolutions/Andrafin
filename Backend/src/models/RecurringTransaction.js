const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['income', 'expense', 'extra'], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  concept: { type: String, required: true, trim: true, maxlength: 140 },
  frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly', 'yearly'], required: true },
  nextDate: { type: Date, required: true, index: true },
  endDate: { type: Date },
  autoCreate: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  notes: { type: String, trim: true, maxlength: 500 }
}, { timestamps: true });

module.exports = mongoose.model('RecurringTransaction', recurringSchema);
