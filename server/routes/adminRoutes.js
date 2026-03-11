const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const classesController = require('../controllers/classesController');
const studentsController = require('../controllers/studentsController');
const roomsController = require('../controllers/roomsController');
const examsController = require('../controllers/examsController');
const assignmentsController = require('../controllers/assignmentsController');
const adminsController = require('../controllers/adminsController'); // NEW

// All admin routes are protected
router.use(authMiddleware);

// Admins
router.get('/admins', adminsController.getAdmins);
router.post('/admins', adminsController.createAdmin);
router.delete('/admins/:id', adminsController.deleteAdmin);

// Classes
router.get('/classes', classesController.getClasses);
router.post('/classes', classesController.createClass);
router.put('/classes/:id', classesController.updateClass);
router.delete('/classes/:id', classesController.deleteClass);

// Students
router.get('/students', studentsController.getStudents);
router.post('/students', studentsController.createStudent);
router.post('/students/import', studentsController.importStudents);
router.post('/students/bulk-transfer', studentsController.bulkTransfer);
router.put('/students/:id', studentsController.updateStudent);
router.delete('/students/:id', studentsController.deleteStudent);

// Rooms
router.get('/rooms', roomsController.getRooms);
router.post('/rooms', roomsController.createRoom);
router.put('/rooms/:id', roomsController.updateRoom);
router.delete('/rooms/:id', roomsController.deleteRoom);

// Exams
router.get('/exams', examsController.getExams);
router.post('/exams', examsController.createExam);
router.put('/exams/:id', examsController.updateExam);
router.delete('/exams/:id', examsController.deleteExam);

// Assignments
router.get('/assignments/:examId', assignmentsController.getAssignments);
router.post('/assignments/generate/:examId', assignmentsController.generateAssignments);
router.post('/assignments/:examId/regenerate', assignmentsController.generateAssignments);
router.delete('/assignments/:examId/reset', assignmentsController.resetAssignments);

module.exports = router;
