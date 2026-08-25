const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['debt_due', 'debt_overdue', 'loan_due', 'loan_overdue', 'recurring_due', 'budget_alert', 'system'], required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  relatedModel: { type: String, enum: ['Debt', 'Loan', 'RecurringTransaction', 'Budget', null], default: null },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  notificationKey: { type: String, unique: true, sparse: true }
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
