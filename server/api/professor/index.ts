import * as express from 'express';
import Exam from './../../models/Exam';

const router = express.Router();

router.post('/test/create', async (req, res, next) => {
  try {
    console.log(req);

    const exam = await Exam.createExam(req.body, req.user);

    res.json(exam);
  } catch (err) {
    next(err);
  }
});

export default router;