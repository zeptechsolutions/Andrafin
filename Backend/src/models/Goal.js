const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  targetAmount: { type: Number, required: true, min: 0.01 },
  currentAmount: { type: Number, default: 0, min: 0 },
  targetDate: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  notes: { type: String, trim: true, maxlength: 500 }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
