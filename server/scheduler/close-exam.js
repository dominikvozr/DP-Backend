/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { parentPort } = require('worker_threads');

const Cabin = require('cabin');
const { Signale } = require('signale');

const tsImport = require('ts-import');

//import Exam from '../models/Exam';

// initialize cabin
const cabin = new Cabin({
    axe: {
        logger: new Signale()
    }
});

// load the queue
const queueFile = path.join(__dirname, 'queue.json');
//const Exam = tsImport.loadSync('../models/Exam');
if (!fs.existsSync(queueFile)) {
    cabin.info(`queue file does not exist yet: ${queueFile}`);
    // signal to parent that the job is done
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
}

const queue = require(queueFile);
(async() => {
    // send emails
    await Promise.all(
        queue.map(async result => {

            // if we've already cancelled this job then return early
            // if (isCancelled) return;

            // if it's before the time we need to send the message then return early
            /* if (Date.now() < new Date(result.date).getTime()) {
                cabin.info('It it not time yet to send message', { result });
                return;
            } */

            //const Exam = tsImport.loadSync(path.join(__dirname, './../models/Exam'));

            cabin.info('Im here ', { result });
            try {
                // find the exam in MongoDB using Mongoose
                /* Exam.findById(result.examId, (err, exam) => {
                    if (err) throw err;

                    // update the exam status to closed
                    exam.isOpen = false;
                    exam.save();

                    console.log(`Exam ${exam._id} has been closed.`);
                }); */

                // flush the queue of this message
                try {
                    const currentQueue = require(queueFile);
                    const index = currentQueue.findIndex(r => r.id === result.id);
                    if (index === -1) return;
                    delete currentQueue[index];
                    await fs.promises.writeFile(
                        queueFile,
                        JSON.stringify(currentQueue.filter(Boolean))
                    );
                } catch (err) {
                    cabin.error(err);
                }
            } catch (err) {
                cabin.error(err);
            }
        }));

    // signal to parent that the job is done
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
})();