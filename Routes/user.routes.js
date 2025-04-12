const express = require('express');
const router = express.Router();
const userController = require('../Controllers/UserController');
const authMiddleware = require('../Middleware/authMiddleware')
const adminMiddleware = require('../Middleware/adminMiddleware')

module.exports = () => {
  router.post('/login', userController.login);
  router.post('/', userController.createUser);
  router.get('/',  adminMiddleware, userController.getUsers);
  router.get('/:id', authMiddleware,  userController.getUserById);
  router.put('/:id',  authMiddleware, userController.updateUser);
  router.delete('/:id',  authMiddleware, userController.deleteUser);
  router.post('/forgot-password', userController.forgotPassword);
  router.post('/reset-password', userController.resetPassword);

  return router;
};
