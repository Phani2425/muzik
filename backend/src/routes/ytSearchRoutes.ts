import express from 'express'
import { searchOnYoutubeByKeyword } from '../controllers/ytSearchController';

const router = express.Router();

router.post('/search/keyword',searchOnYoutubeByKeyword as any);

export default router;