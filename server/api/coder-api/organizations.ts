import {Request, Response, Router} from 'express';
import axios, { AxiosError } from 'axios';
import {setSessionTokenHeader, setORGCookie} from "./users";
const router = Router();

const API_BASE_URL = 'http://bawix.xyz:81/api/v2';

// Set custom headers for all axios requests
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
// Initialize organization
let ORG = 'org';

// Route to create organization
router.post('/organizations',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/organizations `, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get organization by id
router.get('/organizations/:id',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.get(`${API_BASE_URL}/organizations/${req.params.id} `, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to change active organization
router.get('/organizations/change/:id',setSessionTokenHeader, setORGCookie, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.get(`${API_BASE_URL}/organizations/${req.params.id} `, req.body);
        ORG = response.data.id; // ORG is needed for creating workspace
        res.cookie('ORG', ORG);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Helper function to handle Axios errors
function handleAxiosError(error: AxiosError, res: Response) {
    res.status(error.response?.status ?? 500).json(error.response?.data ?? 'Internal Server Error');
}
