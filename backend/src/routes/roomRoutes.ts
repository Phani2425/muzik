import express from 'express';
import { getRoomTracks } from '../controllers/roomController';

const router = express.Router();

router.get('/:roomId/tracks', getRoomTracks as any);

export default router;