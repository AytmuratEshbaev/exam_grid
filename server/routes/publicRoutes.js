const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/today-exams', publicController.getTodayExams);
router.get('/search', publicController.searchStudent);
router.get('/exam/:examId/rooms', publicController.getExamRooms);

module.exports = router;
