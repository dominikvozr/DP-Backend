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
        const ORG = req.cookies['ORG'];
        const UUID = req.cookies['UUID'];
        API_BASE_URL = `http://bawix.xyz:81/api/v2/organizations/${ORG}/members/${UUID}`;
        const response = await axios.post(`${API_BASE_URL}/workspaces`, req.body);
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
router.post('/:workspace/session',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf();
        const email = user['email'];
        const password= user['sessionPass'];
        const name = user['displayName'];
        API_BASE_URL = `http://bawix.xyz:81/@${name}/${req.params.workspace}.main/apps/code-server`
        res.send(`<p>email: ${email}</p>
                        <p>heslo: ${password}</p>
                        <script>window.open("${API_BASE_URL}/?folder=/home/coder","_blank");</script>
                        <a href="${API_BASE_URL}/?folder=/home/coder" target="_blank">
                        Click here to access your workspace! </a>`);
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