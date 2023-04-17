import {Request, Response, Router} from 'express';
import axios, { AxiosError } from 'axios';
import {setSessionTokenHeader} from "./users";
const router = Router();

let API_BASE_URL = 'http://bawix.xyz:81/api/v2';

// Set custom headers for all axios requests
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Route to create a new workspace
router.post('/', setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf();
        const ORG = user['organizationId'];
        const UUID = user['coderId'];
        const sessionToken = user['coderSessionToken']
        API_BASE_URL = `http://bawix.xyz:81/api/v2/organizations/${ORG}/members/${UUID}`;
        const response = await axios.post(`${API_BASE_URL}/workspaces`, req.body,{
            headers: {
                'Coder-Session-Token': sessionToken
            }
        });
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to get all workspaces
router.get('/',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/workspaces`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to extend workspace deadline
router.put('/:id/extend', setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.put(`${API_BASE_URL}/workspaces/${req.params.id}/extend`, req.body);
        res.json(response.data);
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to redirect to workspace link
router.get('/:workspace/session',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf();
        const email = user['email'];
        const name = user['displayName'];
        const password= user['sessionPass'];

        API_BASE_URL = `http://bawix.xyz:81/@${name}/${req.params.workspace}.main/apps/code-server`
        const workspace = "${API_BASE_URL}/?folder=/home/coder"
        const response= {
            email:email,
            password:password,
            workspaceLink: workspace
        }
        res.json(JSON.stringify(response));
    } catch (error) {
        handleAxiosError(error, res);
    }
});

// Route to autostart workspace
router.put('/:id/autostart', setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const response =
            await axios.put(`${API_BASE_URL}/workspaces/${req.params.id}/autostart`, req.body);
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