import { Request, Response, NextFunction,Router } from 'express';
import axios, {AxiosError} from 'axios';
import * as cookieParser from 'cookie-parser';
// import * as console from "console";
const router = Router();

// URL to our Coder Server
const API_BASE_URL = 'http://bawix.xyz:81/api/v2';
// Initialize session token
let SESSION_TOKEN = 'session_token';
// Initialize user
let UUID = 'me';
// Initialize organization
let ORG = 'org';
// Middleware to set session token in headers
export const setSessionTokenHeader = (req: Request, _res: Response, next: NextFunction ) => {
    axios.defaults.headers.common['Coder-Session-Token'] = req.cookies['coder_session_token'];
    next();
};

// Middleware to set sessions token in cookie
const setSessionTokenCookie = (_req: Request, res: Response, next: NextFunction ) => {
    res.cookie('coder_session_token', SESSION_TOKEN);
    next();
};

// Middleware to set user ID in cookie for future calls
const setUserCookie = (_req: Request, res: Response, next: NextFunction ) => {
    res.cookie('UUID', UUID);
    next();
};
// Middleware to set org ID in cookie for future calls
export const setORGCookie = (_req: Request, res: Response, next: NextFunction ) => {
    res.cookie('ORG', ORG);
    next();
};

// Use cookie-parser middleware
router.use(cookieParser());

// Set custom headers for all axios requests
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Route to get a list of all users
router.get('/users',setSessionTokenHeader, async (_req: Request, res: Response) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users`);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get a single user by ID
router.get('/users/:id',setSessionTokenHeader,setUserCookie,setORGCookie, async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${req.params.id}`);
        UUID = response.data.id; // User ID for unique calls
        res.cookie('UUID', UUID);
        ORG = response.data.organization_ids[0]; // ORG is needed for creating workspace
        res.cookie('ORG', ORG);
        res.json(response.data);
    } catch (error) {
        // console.log(error)
        handleAxiosError(error, res);
    }
});

// Route to get an organization by user
router.get('/users/:id/organization',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.get(`${API_BASE_URL}/users/${req.params.id}/organizations`);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get user roles
router.get('/users/:id/roles',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.get(`${API_BASE_URL}/users/${req.params.id}/roles`);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to login user
router.post('/users/login',setSessionTokenCookie, async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, req.body);
        SESSION_TOKEN = response.data.session_token; // Update session token
        res.cookie('coder_session_token', SESSION_TOKEN);
        res.send("You are logged in !");
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// For dev purposes only
router.get('/dev-login',setSessionTokenCookie, async (_req: Request, res: Response) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`,
            '{"email": "smetankaxmartin@gmail.com","password": "FgDiP20q12"}');
        SESSION_TOKEN = response.data.session_token; // Update session token
        res.cookie('coder_session_token', SESSION_TOKEN);
        res.send("You are logged in !");
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to logout user
router.post('/users/logout',setSessionTokenHeader, setSessionTokenCookie,setUserCookie,setORGCookie, async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/logout`, req.body);
        SESSION_TOKEN = ''; // Clear session token
        res.cookie('coder_session_token', SESSION_TOKEN);
        UUID = ''; // Clear user ID
        res.cookie('UUID', UUID);
        ORG = ''; // Clear org ID
        res.cookie('ORG', ORG);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get new session key
router.post('/users/:id/keys ',setSessionTokenHeader,setSessionTokenCookie, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.post(`${API_BASE_URL}/users/${req.params.id}/keys`, req.body);
        SESSION_TOKEN = response.data.key;
        res.cookie('coder_session_token', SESSION_TOKEN);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to create a new user
router.post('/users',setSessionTokenHeader,setUserCookie,setORGCookie, async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users`, req.body);
        UUID = response.data.id; // User ID for unique calls
        res.cookie('UUID', UUID);
        ORG = response.data.organization_ids[0]; // ORG is needed for creating workspace
        res.cookie('ORG', ORG);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to assign role to user
router.put('/users/:id/roles',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.put(`${API_BASE_URL}/users/${req.params.id}/roles`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to update an existing user
router.put('/users/:id',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/${req.params.id}`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to delete a user by ID
router.delete('/users/:id',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/users/${req.params.id}`);
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