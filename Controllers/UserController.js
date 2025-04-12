const User = require('../Models/User.schema');
const nodemailer = require('nodemailer'); // You'll need to install this package
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST
  }
});

exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    if(!req.isAdmin){
      var user = await User.findOne(req.user.userId);
    }
    else{
      var user = await User.findOne(req.params.id);
    }
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if(!req.isAdmin){
      var user = await User.findOneAndUpdate(req.user.userId);
    }
    else{
      var user = user = await User.findOneAndUpdate({uuid: req.params.id}, req.body, { new: true });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if(!req.isAdmin){
      var user = await User.findOneAndDelete(req.user.userId);
    }
    else{
      var user = await User.findOneAndDelete({uuid: req.params.id});
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Find user by username
    const user = await User.findOne({ username });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.uuid, username: user.username, role:user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Return token and user info (without password)
    const userData = {
      uuid: user.uuid,
      username: user.username,
      email: user.email,
    };
    
    res.status(200).json({
      token,
      user: userData
    });
    
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Still return a positive response for security reasons
      return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Store token and expiry in user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    
    // Create reset URL
    const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your account.</p>
        <p>Please click on the following link to reset your password:</p>
        <a href="${resetUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};

// Reset password functionality
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }
    
    // Update user in MongoDB
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};