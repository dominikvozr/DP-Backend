import axios from 'axios';
import * as express from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const unzipper = require('unzipper');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const simpleGit = require('simple-git');
// eslint-disable-next-line @typescript-eslint/no-var-requires
//const rimraf = require('rimraf');


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
const giteaApiUrl = `${process.env.GITEA_URL}/api/v1`;

// Axios instance for Gitea API requests
export const giteaAxios = axios.create({
  baseURL: giteaApiUrl,
  headers: {
    // Add the Gitea API token here
    'Authorization': `token ${process.env.GITEA_API_TOKEN}`,
  },
});

// Get user repositories
router.get('/api/user/repos', async (req, res) => {
  try {
    const response = await giteaAxios.get(`/users/${req.user.gitea.username}/repos`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get repository by ID
router.get('/api/repos/:id', async (req, res) => {
  try {
    const response = await giteaAxios.get(`/repos/${req.user.gitea.username}/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update repository by ID
router.put('/api/repos/:id', async (req, res) => {
  try {
    const updateData = req.body;
    const response = await giteaAxios.patch(`/repos/${req.user.gitea.username}/${req.params.id}`, updateData);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete repository by ID
router.delete('/api/repos/:id', async (req, res) => {
  try {
    await giteaAxios.delete(`/repos/${req.user.gitea.username}/${req.params.id}`);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Show repository by ID
router.get('/api/repos/:id/show', async (req, res) => {
  try {
    const response = await giteaAxios.get(`/repos/${req.user.gitea.username}/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload repository
router.post('/api/upload/repo', async (req, res) => {
  try {
    const repoData = req.body;
    const response = await giteaAxios.post(`/user/repos`, repoData);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file to repository with commit message and push
router.post('/api/repos/:id/upload', async (req, res) => {
  try {
    const { content, filepath, message, branch } = req.body;

    const response = await giteaAxios.put(
      `/repos/${req.user.gitea.username}/${req.params.id}/contents/${filepath}`,
      {
        content: Buffer.from(content).toString('base64'),
        message,
        branch: branch || 'master',
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;