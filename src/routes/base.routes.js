import { Router } from 'express';
import { baseExample } from '../controllers/base.controller.js';

const router = Router();

router.get('/', baseExample);

export default router;
