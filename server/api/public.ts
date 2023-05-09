import * as express from 'express';
import Exam from './../models/Exam';
import Test from './../models/Test';

const router = express.Router();

router.get('/test', async (_, res) => {
  console.log('API server got request from APP server or browser');
  res.json('test');
});

router.get('/evaluate', async (req, res) => {
  const examId = req.query.examId
  if (typeof examId !== 'string' && !(examId instanceof String)){
    res.status(500).json('exam id is not valid: ' + examId)
    return
  }

  console.log(examId);
  Exam.findById(examId, function (err, exam) {
    if (err) return console.log(err);
    // Set the "isOpen" property of the document to "false"
    exam.isOpen = false;
    // Save the updated document
    exam.save(function (err) {
      if (err) return console.log(err);
      console.log('Exam updated successfully!');
    });
  });

  const message = await Test.evaluateTests(examId as string)
  console.log(message);
  res.json('test');
});

export default router;
