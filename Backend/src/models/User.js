const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  currency: { type: String, default: 'USD', immutable: true },
  passwordResetCodeHash: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  notifications: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    daysBeforeDue: { type: [Number], default: [3, 1, 0] }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
