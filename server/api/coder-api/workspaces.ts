import {Request, Response, Router} from 'express';
import axios, { AxiosError } from 'axios';
import {setSessionTokenHeader} from "./users";
import {createMailData, transporter} from "./utils/utils";
const router = Router();

const API_BASE_URL = 'http://bawix.xyz:81/api/v2';

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
        const API_BASE_URL = `http://bawix.xyz:81/api/v2/organizations/${ORG}/members/${UUID}`;
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
router.get('/session/:username/:workspace',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf();
        const email = user['email'];
        const password= user['sessionPass'];
        const token = user['coderSessionToken']
        // const workspace = `http://bawix.xyz:81/login?redirect=%2F%40${req.params.username}%2F${req.params.workspace}.main%2Fapps%2Fcode-server`;
        const workspace = `http://bawix.xyz:81/@${req.params.username}/${req.params.workspace}.main/apps/code-server/`
        const response= {
            email:email,
            password:password,
            workspaceLink: workspace,
            sessionToken: token
        }
        res.json(JSON.stringify(response));
    } catch (error) {
        handleAxiosError(error, res);
    }
});
router.post('/session/email',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf();
        const email = user['email'];
        const password= user['sessionPass'];
        const mailOption = createMailData(email,password)
        transporter.sendMail(mailOption,function (err, info) {
            if(err)
                res.json({error:err})
            else
                res.json(info)
        });
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

router.get('/status/:username/:workspace',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf();
        const sessionToken = user['coderSessionToken']
        const response =
            await axios.get(`${API_BASE_URL}/users/${req.params.username}/workspace/${req.params.workspace}`,  {
                headers: {
                    'Coder-Session-Token': sessionToken}
        });
        res.json(response.data);

    } catch (error) {
        res.json({latest_build:{status:"unfound"}, error: error.response?.data});
    }
});

router.get('/status/:workspaceId',setSessionTokenHeader, async (req: Request, res: Response) => {
    try {
        const user = req.user.valueOf();
        const sessionToken = user['coderSessionToken']
        const response =
            await axios.get(`${API_BASE_URL}/workspaces/${req.params.workspaceId}/watch`,  {
                headers: {
                    'Coder-Session-Token': sessionToken
                }
            });
        res.json(JSON.stringify({response:response.data, url:`${API_BASE_URL}/workspaces/${req.params.workspaceId}/watch`}));

    } catch (error) {
        res.json({latest_build:{status:"unfound"}, error: error.response?.data});
    }
});

// Helper function to handle Axios errors
function handleAxiosError(error: AxiosError, res: Response) {
    res.status(error.response?.status ?? 500).json(error.response?.data ?? `Internal Server Error: ${error.cause}`);
}

export default router;