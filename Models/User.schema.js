const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcryptjs = require('bcryptjs');

const SALT_ROUNDS = 12;

const UserSchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4, unique: true, index: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

UserSchema.pre('validate', function (next) {
  // Force role to USER during registration
  if (this.isNew && this.role !== 'USER') {
    this.role = 'USER';
  }
  next();
});

// Pre-save hook for password and username
UserSchema.pre('save', async function (next) {
  try {
    // Normalize username
    if (this.isModified('username') && this.username) {
      this.username = this.username.toLowerCase();
    }

    // Hash password
    if (this.isModified('password')) {
      const hash = await bcryptjs.hash(this.password, SALT_ROUNDS);
      this.password = hash;
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);