const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const investigationRoutes = require('./investigationRoutes');
const reportRoutes = require('./reportRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Mount Subrouters
router.use('/auth', authRoutes);
router.use('/investigations', investigationRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;

