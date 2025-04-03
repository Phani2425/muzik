import express from 'express';
import { getAdminId, getRoomTracks } from '../controllers/roomController';

const router = express.Router();

router.get('/:roomId/tracks', getRoomTracks as any);
router.get('/:roomId/isadmin', getAdminId as any);

export default router;