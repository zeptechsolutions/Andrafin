const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 50 },
  kind: { type: String, enum: ['income', 'expense', 'both'], default: 'both' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.index({ user: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Category', categorySchema);
