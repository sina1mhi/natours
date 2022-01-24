const express = require('express');

const controller = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// SPECIAL ROUTES
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword', authController.protect, authController.updateMyPassword);

router.patch('/updateMe', authController.protect, controller.updateMe);
router.delete('/deleteMe', authController.protect, controller.deleteMe);

// REST ROUTES
router.route('/').get(controller.getAllUsers).post(controller.createUser);
router.route('/:id').get(controller.getUser).patch(controller.updateUser).delete(controller.deleteUser);

module.exports = router;
