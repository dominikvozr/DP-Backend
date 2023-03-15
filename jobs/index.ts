/* eslint-disable @typescript-eslint/no-var-requires */
//import Exam from "./../server/models/Exam";
//const path = require('path');

export default [
  {
    name: 'close-exam',
    path: './../server/scheduler/close-exam.js'//path.join(__dirname, 'server/scheduler/close-exam.js')
   // handler: closeExam,
  }
]
/*
function closeExam(jobData) {
  // find the exam in MongoDB using Mongoose
  console.log(jobData);

  Exam.findById(jobData.examId, (err, exam) => {
    if (err) throw err;

    // update the exam status to closed
    exam.isOpen = false;
    exam.save();

    console.log(`Exam ${exam._id} has been closed.`);
  });
}
 */