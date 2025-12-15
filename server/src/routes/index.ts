import express from 'express';
import authRoutes from './auth';
import questionRoutes from './questions';
import testRoutes from './tests';
import mockTestRoutes from './mockTest';
import studyRoutes from './study';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/tests', testRoutes);
router.use('/mock-test', mockTestRoutes);
router.use('/study', studyRoutes);

export default router;


