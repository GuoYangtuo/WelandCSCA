import express from 'express';
import authRoutes from './auth';
import questionRoutes from './questions';
import testRoutes from './tests';
import mockTestRoutes from './mockTest';
import studyRoutes from './study';
import adminRoutes from './admin';
import difyRoutes from './dify';
import ordersRoutes from './orders';
import institutionRoutes from './institution';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/tests', testRoutes);
router.use('/mock-test', mockTestRoutes);
router.use('/study', studyRoutes);
router.use('/admin', adminRoutes);
router.use('/dify', difyRoutes);
router.use('/orders', ordersRoutes);
router.use('/institution', institutionRoutes);

export default router;


