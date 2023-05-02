import Exam from "../models/Exam";

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const randomstring = require("randomstring");
const schedule = require('node-schedule');

class Scheduler {
    private static _instance: Scheduler;
    private scheduler;
    private cabin;
    private queueFile;

    private constructor() {

      // create persistent email queue file if it doesn't already exist
      // note you could swap out this for MongoDB (e.g. Mongoose), SQL, Redis, etc
      // as Bree will read and update this file every few seconds to flush teh queue
      /* this.queueFile = path.join(__dirname, 'queue.json');
      if (!fs.existsSync(this.queueFile)) fs.writeFileSync(this.queueFile, JSON.stringify([]));

      this.cabin = new Cabin({
        axe: {
          logger: new Signale()
        }
      }); */

      // new Bree instance with Cabin logger
      /* this.scheduler = new Bree({
        logger: this.cabin,
        jobs: [
          {
            name: 'close-exam',
            path: path.join(__dirname, 'close-exam.js'),
          }
        ]
      }) */

      // Graceful for handling graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
      /* const graceful = new Graceful({ brees: [this.scheduler] });
      graceful.listen(); */

      // start all jobs (this is the equivalent of reloading a crontab):
      //this.scheduler.start();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new Scheduler();
        return this._instance;
    }

    public async scheduleExamBreeEnd(name: string, dateTime: Date, jobData: object){
      // this.scheduler.schedule(name, dateTime, jobData)

      let queue = [];
      try {
        queue = require(this.queueFile);
      } catch (err) {
        this.cabin.debug(err);
      }

      const id = randomstring.generate(10)

      queue.push({
        id,
        name,
        dateTime,
        jobData,
      });
      console.log(queue);

      await fs.promises.writeFile(this.queueFile, JSON.stringify(queue));

      console.log(name, dateTime, jobData);

      const jobName = `${name}-${id}`
      this.scheduler.add({
        name: jobName,
        path: path.join(__dirname, 'close-exam.js'),
        date: dateTime,
        worker: {
          workerData: jobData
        }
      })

      console.log(this.scheduler.jobs);

      this.scheduler.run();

      // send email
      /* await email.send({
        message: {
          to: req.body.email,
          subject: 'Booking Confirmed',
          html: '<p>Your booking is confirmed!</p>'
        }
      }); */
    }

  public async scheduleExamSimple(start: Date, end: Date, jobData: {examId: string}){
    console.log('Scheduling exam start and end:', start, end, jobData);
    console.log('Server timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    this.scheduleExamStart(start, jobData)
    this.scheduleExamEnd(end, jobData)
  }

  private async scheduleExamStart(start: Date, jobData: {examId: string}){
    // Define the job schedule to run on a specific date and time (in this example, March 20th 2023 at 12:00:00)
    schedule.scheduleJob({ start, rule: start, tz: 'Europe/Bratislava' }, function() {
      // Find the document you want to update (replace "id_of_exam" with the ID of the exam you want to update)
      Exam.findById(jobData.examId, function(err, exam) {
        if (err) return console.log(err);

        // Set the "isOpen" property of the document to "false"
        exam.isOpen = true;
        console.log(start);
        console.log(exam);


        // Save the updated document
        exam.save(function(err) {
          if (err) return console.log(err);
          console.log('Exam updated successfully!');
        });
      });
    });
    //console.log('Exam start scheduled:', startJob.nextInvocation());
  }

  private async scheduleExamEnd(end: Date, jobData: {examId: string}){
    // Define the job schedule to run on a specific date and time (in this example, March 20th 2023 at 12:00:00)
      // Europe/Bratislava
      schedule.scheduleJob({ start: end, rule: end, tz: 'Europe/Bratislava' }, function() {
        // Find the document you want to update (replace "id_of_exam" with the ID of the exam you want to update)
        Exam.findById(jobData.examId, function(err, exam) {
          if (err) return console.log(err);

          // Set the "isOpen" property of the document to "false"
          exam.isOpen = false;
          console.log(end);
          console.log(exam);


          // Save the updated document
          exam.save(function(err) {
            if (err) return console.log(err);
            console.log('Exam updated successfully!');
          });
        });
      });
      //console.log('Exam start scheduled:', endJob.nextInvocation());
  }
}

export default Scheduler;