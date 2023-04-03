import * as express from 'express';
import { generateSlug } from '../../utils/slugify';
import { giteaAxios } from '../git';
//import { UserDocument } from 'server/models/User';
import Exam from './../../models/Exam';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const unzipper = require('unzipper');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const simpleGit = require('simple-git');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rimraf = require('rimraf');


// MulterRequest to prevent errors
interface MulterRequest extends express.Request {
    file: any;
}

interface IndexRequest extends express.Request {
    page: string;
}

// Multer storage initialization
const storage = multer.diskStorage({
  destination: 'upload/test/',
  filename: (_req, file, callback) => {
    const originalName = file.originalname;
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const randomName = Math.random().toString(36).substring(2, 15);
    callback(null, randomName + extension);
  },
});
const upload = multer({ storage: storage}) // for parsing multipart/form-data
const router = express.Router();

router.post('/create', async (req: any, res, next) => {
  try {
    const slug = await generateSlug(Exam, req.body.name);

    // create repository
    const examRepoResponse = await giteaAxios(req.user.gitea.accessToken.sha1).post(`/user/repos`, {name: `${slug}-exam`});
    if (examRepoResponse.status > 299) {
      throw new Error('Failed to create Repository');
    }

    const testRepoResponse = await giteaAxios(req.user.gitea.accessToken.sha1).post(`/user/repos`, {name: `${slug}-test`});
    if (testRepoResponse.status > 299) {
      throw new Error('Failed to create Repository');
    }

    // Extract zip file to projects folder
    // const user = req.user as UserDocument
    const projectsFolder = `upload/projects/${Math.random().toString(36).slice(-8)}`
    const testsFolder = `upload/pipelines/${Math.random().toString(36).slice(-8)}`
    const zipFilePath = req.body.project.path;
    const testFilePath = req.body.testsFile.path;


    fs.createReadStream(testFilePath)
      .mkdir(testsFolder, { recursive: true })
      .on('finish', () => {
        // Initialize git repository in projects folder and commit changes
        const git = simpleGit(testsFolder);
        git.init()
          .add('./*')
          .commit('Initial commit')
          .addRemote('origin', `${process.env.GITEA_URL}/api/v1/${req.user.gitea.username}/${slug}-test.git`)
          .push('origin', 'master', () => {
            console.log('Changes committed to GitHub');
            rimraf(testsFolder, () => {
              console.log('Projects folder cleaned up');
            });
          });
      });


    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: projectsFolder }))
      .on('finish', () => {
        console.log('Zip file extracted successfully');

        // Initialize git repository in projects folder and commit changes
        const git = simpleGit(projectsFolder);
        if (!fs.existsSync(`${projectsFolder}/.git`))
          git.init()

        git.add('./*')
          .commit('Initial commit')
          .addRemote('origin', `${process.env.GITEA_URL}/api/v1/${req.user.gitea.username}/${slug}-exam.git`)
          .push('origin', 'master', () => {
            console.log('Changes committed to GitHub');
            rimraf(projectsFolder, () => {
              console.log('Projects folder cleaned up');
            });
          });
      });

    const exam = await Exam.createExam(req.body, req.user, slug);
    res.json({exam, message: 'success'});
  } catch (err) {
    next(err);
  }
});

router.get('/index', async (req: IndexRequest, res, next) => {
  try {
    console.log(req.user);

    const page = parseInt(req.query.page.toString())
    const data = await Exam.getExams(req.user, page);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, data});
  } catch (err) {
    next(err);
  }
})

router.get('/show/:id', async (req, res, next) => {
  try {
    const exam = await Exam.getExam(req.params.id, req.user);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, exam});
  } catch (err) {
    next(err);
  }
})

router.get('/get', async (req, res, next) => {
  try {
    const exam = await Exam.getExamBySlug(req.query.test as string, req.user);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, exam});
  } catch (err) {
    next(err);
  }
})

router.get('/delete/:id', async (req, res, next) => {
  try {
    const result = await Exam.deleteExam(req.params.id, req.user);
    console.log(result);
    res.json({result: 'success'});
  } catch (err) {
    next(err);
  }
})

router.post('/upload/project', upload.single('project'), (req: MulterRequest, res) => {
  res.json(req.file)
});

router.post('/upload/tests', upload.single('tests'), (req: MulterRequest, res, next) => {
  try {
    const file = req.file
    fs.readFile(file.path, 'utf-8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading file tests file');
      return;
    }

    const regex = /@Test\s+public void\s+(\w+)\((.*?)\)/g;
    const matches = [];

    let match;
    let id = 1;
    while (match = regex.exec(data)) {
      const testName = match[1];
      const testParams = match[2];
      matches.push({ id, name: `${testName}(${testParams})`, points: 0 });
      id++;
    }

    res.json({file, matches});
  });
    //const exam = await Exam.createExam(req.body, req.user);
  } catch (err) {
    next(err);
  }
});

export default router;