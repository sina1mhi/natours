const express = require('express');

const controller = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/top-five-cheap').get(controller.aliasTopTours, controller.getAllTours);
router.route('/tour-stats').get(controller.getTourStats);
router.route('/monthly-plan/:year').get(controller.getMonthlyPlan);
router.route('/').get(authController.protect, controller.getAllTours).post(controller.createTour);
router
  .route('/:id')
  .get(controller.getTour)
  .patch(controller.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), controller.deleteTour);

module.exports = router;
