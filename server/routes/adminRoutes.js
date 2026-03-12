const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const classesController = require('../controllers/classesController');
const studentsController = require('../controllers/studentsController');
const roomsController = require('../controllers/roomsController');
const examsController = require('../controllers/examsController');
const assignmentsController = require('../controllers/assignmentsController');
const adminsController = require('../controllers/adminsController'); // NEW

// All admin routes are protected
router.use(authMiddleware);

// Helpers for roles
const superadminOnly = requireRole(['superadmin']);
const anyAdmin = requireRole(['superadmin', 'invigilator']); // Both can view

// Admins (Superadmin only for view and modify)
router.get('/admins', superadminOnly, adminsController.getAdmins);
router.post('/admins', superadminOnly, adminsController.createAdmin);
router.delete('/admins/:id', superadminOnly, adminsController.deleteAdmin);

// Classes (Both can view, only superadmin can modify)
router.get('/classes', anyAdmin, classesController.getClasses);
router.post('/classes', superadminOnly, classesController.createClass);
router.put('/classes/:id', superadminOnly, classesController.updateClass);
router.delete('/classes/:id', superadminOnly, classesController.deleteClass);

// Students (Both can view, only superadmin can modify)
router.get('/students', anyAdmin, studentsController.getStudents);
router.post('/students', superadminOnly, studentsController.createStudent);
router.post('/students/import', superadminOnly, studentsController.importStudents);
router.post('/students/import-ids', superadminOnly, studentsController.importStudentIds);
router.post('/students/update-logins', superadminOnly, studentsController.updateLogins);
router.post('/students/bulk-transfer', superadminOnly, studentsController.bulkTransfer);
router.put('/students/:id', superadminOnly, studentsController.updateStudent);
router.delete('/students/:id', superadminOnly, studentsController.deleteStudent);

// Rooms (Both can view, only superadmin can modify)
router.get('/rooms', anyAdmin, roomsController.getRooms);
router.post('/rooms', superadminOnly, roomsController.createRoom);
router.put('/rooms/:id', superadminOnly, roomsController.updateRoom);
router.delete('/rooms/:id', superadminOnly, roomsController.deleteRoom);

// Exams (Both can view, only superadmin can modify)
router.get('/exams', anyAdmin, examsController.getExams);
router.post('/exams', superadminOnly, examsController.createExam);
router.put('/exams/:id', superadminOnly, examsController.updateExam);
router.delete('/exams/:id', superadminOnly, examsController.deleteExam);

// Assignments (Both can view, only superadmin can generate/reset)
router.get('/assignments/:examId', anyAdmin, assignmentsController.getAssignments);
router.post('/assignments/generate/:examId', superadminOnly, assignmentsController.generateAssignments);
router.post('/assignments/:examId/regenerate', superadminOnly, assignmentsController.generateAssignments);
router.delete('/assignments/:examId/reset', superadminOnly, assignmentsController.resetAssignments);

module.exports = router;
