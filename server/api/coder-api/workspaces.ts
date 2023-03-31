import express, { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
const router = express.Router();

const ORG = 'organization_here';
const USER = 'user_here';
const API_BASE_URL = `https://bawix.xyz:81/api/v2/organizations/${ORG}/members/${USER}`;

// Set custom headers for all axios requests
axios.defaults.headers.common['Coder-Session-Token'] = 'session_token';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Route to create a new workspace
router.post('/workspaces', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/workspaces`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get all workspaces
router.get('/workspaces', async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/workspaces`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Helper function to handle Axios errors
function handleAxiosError(error: AxiosError, res: Response) {
    res.status(error.response?.status ?? 500).json(error.response?.data ?? 'Internal Server Error');
}
