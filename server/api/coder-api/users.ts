import express, { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
const router = express.Router();

const API_BASE_URL = 'https://bawix.xyz:81/api/v2';

// Set custom headers for all axios requests
axios.defaults.headers.common['Coder-Session-Token'] = 'session_token';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Route to get a list of all users
router.get('/users', async (_req: Request, res: Response) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users`);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get a single user by ID
router.get('/users/:id', async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get an organization by user
router.get('/users/:id/organization', async (req: Request, res: Response) => {
    try {
        const response =
            await axios.get(`${API_BASE_URL}/users/${req.params.id}/organizations`);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get user roles
router.get('/users/:id/roles', async (req: Request, res: Response) => {
    try {
        const response =
            await axios.get(`${API_BASE_URL}/users/${req.params.id}/roles`);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to create a new user
router.post('/users', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to assign role to user
router.put('/users/:id/roles', async (req: Request, res: Response) => {
    try {
        const response =
            await axios.put(`${API_BASE_URL}/users/${req.params.id}/roles`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to update an existing user
router.put('/users/:id', async (req: Request, res: Response) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/${req.params.id}`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to delete a user by ID
router.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/users/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to logout user
router.post('/users/logout', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/logout `, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get new session key
router.post('/users/:id/keys ', async (req: Request, res: Response) => {
    try {
        const response =
            await axios.post(`${API_BASE_URL}/users/${req.params.id}/keys `, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Helper function to handle Axios errors
function handleAxiosError(error: AxiosError, res: Response) {
    res.status(error.response?.status ?? 500).json(error.response?.data ?? 'Internal Server Error');
}

export default router;
