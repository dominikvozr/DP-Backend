import axios from 'axios';
import * as express from 'express';
import { generateSlug } from '../../utils/slugify';
import Exam from './../../models/Exam';
import Test from './../../models/Test';
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
    const randomName = 'tests';
    callback(null, randomName + extension);
  },
});
const upload = multer({ storage: storage}) // for parsing multipart/form-data
const router = express.Router();

router.post('/create', async (req: any, res, next) => {
  try {
    const slug = await generateSlug(Exam, req.body.name);
    const defaultBranch = 'master'
    const projectsFolder = `upload/projects/${Math.random().toString(36).slice(-8)}`
    const testsFolder = `upload/tests/${Math.random().toString(36).slice(-8)}`
    const zipFilePath = req.body.project.path;
    const testFilePath = req.body.testsFile.path;
    const testFile = testFilePath.split('/').pop()
    const accessToken = req.user.gitea.accessToken.sha1
    const username = req.user.gitea.username

    // create repository
    const examRepoResponse = await axios.post(`${process.env.GITEA_URL}/api/v1/user/repos`,
    {
      name: `${slug}-exam`,
      private: true,
      default_branch: defaultBranch,
    },
    {
      headers: {
        Authorization: `token ${req.user.gitea.accessToken.sha1}`
      }
    });
    if (examRepoResponse.status > 299) {
      throw new Error('Failed to create Repository');
    }

    const testRepoResponse = await axios.post(`${process.env.GITEA_URL}/api/v1/user/repos`,
    {
      name: `${slug}-test`,
      private: true,
      default_branch: defaultBranch,
    },
    {
      headers: {
        Authorization: `token ${req.user.gitea.accessToken.sha1}`
      }
    });
    if (testRepoResponse.status > 299) {
      throw new Error('Failed to create Repository');
    }

    fs.mkdirSync(testsFolder, { recursive: true })
    fs.rename(testFilePath, `${testsFolder}/${testFile}`, function (err) {
      if (err) throw err
    })

    // Initialize git repository in projects folder and commit changes
    const git = simpleGit(testsFolder, { config: [`user.email=${req.user.email}`, `user.name=${req.user.displayName}`] });
    await git.init()
    await git.add('./*')
    await git.commit('Initial commit')
    // Push the changes
    const gitProjRes = await git.push(`http://${accessToken}@bawix.xyz:81/gitea/${username}/${slug}-test.git`, defaultBranch);
    console.log(gitProjRes, 'Changes committed to GitHub');
    const rimrafRes = await rimraf(testsFolder);
      if(rimrafRes)
        console.log('Projects folder cleaned up');

    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: projectsFolder }))
      .on('finish', async () => {
        console.log('Zip file extracted successfully');

        // Initialize git repository in projects folder and commit changes
        const git = simpleGit(projectsFolder, { config: [`user.email=${req.user.email}`, `user.name=${req.user.displayName}`] });
        if (!fs.existsSync(`${projectsFolder}/.git`))
          await git.init()

        await git.add('./*')
        await git.commit('Initial commit')
        const gitExamRes = await git.push(`http://${accessToken}@bawix.xyz:81/gitea/${username}/${slug}-exam.git`, defaultBranch);
        console.log(gitExamRes, 'Changes committed to GitHub');
        const rimrafRes = await rimraf(projectsFolder);
        if(rimrafRes)
          console.log('Projects folder cleaned up');

      });

    const exam = await Exam.createExam(req.body, req.user, slug);
    res.json({exam, message: 'success'});
  } catch (err) {
    next(err);
  }
});

router.get('/index', async (req: IndexRequest, res, next) => {
  try {
    const page = parseInt(req.query.page.toString())
    const data = await Exam.getExams(req.user, page);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, data});
  } catch (err) {
    next(err);
  }
})

router.get('/show/:id', async (req, res, next) => {
  try {
    console.log(req.params.id);
    const exam = await Exam.getExam(req.params.id, req.user);
    const tests = await Test.getTestsByExam(req.params.id, req.user);
    res.json({isAuthorized: req.user ? true : false, user: req.user || null, exam, tests});
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