import { Request, Response, NextFunction,Router } from 'express';
import axios, {AxiosError} from 'axios';
import * as cookieParser from 'cookie-parser';
import * as process from "process";
import User from "../../models/User";
import {validateUsername} from "./utils/utils";
const router = Router();
const generator = require('generate-password');


// URL to our Coder Server
const API_BASE_URL = process.env.API_BASE_URL;
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
        handleAxiosError(error, res);
    }
});

// Route to get an organization by user
router.get('/users/:id/organization',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.get(`${API_BASE_URL}/users/${req.params.id}/organizations`);
        ORG = response.data[0].id; // ORG is needed for creating workspace
        res.cookie('ORG', ORG);
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
router.post('/users/login',setSessionTokenCookie,setUserCookie,setORGCookie,
    async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf()
        let pass = user['sessionPass']

        if(req.body.password){
            pass = req.body.password
        }
        const data = {
            email: user['email'],
            password: pass
        }
        const responseLogin = await axios.post(`${API_BASE_URL}/users/login`, JSON.stringify(data));

        SESSION_TOKEN = responseLogin.data.session_token; // Update session token

        const responseUser = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: {
            'Coder-Session-Token': SESSION_TOKEN
            }
        });

        UUID = responseUser.data.id; // User ID for unique calls
        ORG = responseUser.data.organization_ids[0]; // ORG is needed for creating workspace
        await User.updateCoderData({userId:user['id'],organizationId:ORG,coderId:UUID,coderSessionToken:SESSION_TOKEN})
        res.json(responseUser.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

router.post('/users/password',setSessionTokenHeader, setSessionTokenCookie,setUserCookie,setORGCookie, async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf()
        const UUID = user['coderId'];
        const SESSION_TOKEN = user['coderSessionToken']
        const oldPass = user['sessionPass'];
        const newPass = generator.generate({
            length: 10,
            numbers: true
        })
        const body = {
            old_password: oldPass,
            password: newPass
        }
        const response = await axios.post(`${API_BASE_URL}/users/${UUID}/password`, body, {
            headers: {
                'Coder-Session-Token': SESSION_TOKEN
            }
        });
        await User.updatePass({userId:UUID,newPass:newPass});
        res.json(response.data);

    }catch (error){
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
        const creatorBody = {
            email: process.env.USER_ADMIN_EMAIL,
            password: process.env.USER_ADMIN_PASS,

        }
        const creatorResponse = await axios.post(`${API_BASE_URL}/users/login`,
            JSON.stringify(creatorBody));

        const creatorToken = creatorResponse.data.session_token;

        const creatorInfo = await axios.get(`${API_BASE_URL}/users/me`,
            {
                headers: {
                    'Coder-Session-Token': creatorToken
                }
            });
        const orgId = creatorInfo.data.organization_ids[0];

        const newUser = req.user.valueOf()
        const newPass = generator.generate({
                length: 10,
                numbers: true
            })

        const newUserBody = {
            email: newUser['email'],
            organization_id:orgId,
            password: newPass,
            username: validateUsername(newUser['slug'])
        }
        const responseCreate = await axios.post(`${API_BASE_URL}/users`,  JSON.stringify(newUserBody),
                {
                    headers: {
                        'Coder-Session-Token': creatorToken
                    }
                });

        await User.updatePass({userId:newUser['id'],newPass:newPass})

        UUID = responseCreate.data.id; // User ID for unique calls
        ORG = responseCreate.data.organization_ids[0]; // ORG is needed for creating workspace
        const loginBody = {
            email: responseCreate.data.email,
            password: newPass
        }

        const responseLogin = await axios.post(`${API_BASE_URL}/users/login`,  JSON.stringify(loginBody))

        SESSION_TOKEN = responseLogin.data.session_token;
        await User.updateCoderData({userId:newUser['id'],organizationId:ORG,coderId:UUID,coderSessionToken:SESSION_TOKEN})

    } catch (error) {

        console.log(error.cause)
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
