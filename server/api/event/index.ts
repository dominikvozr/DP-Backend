/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import Event from '../../models/Event';
const router = express.Router();

router.get('/index', async (req: any, res: any) => {
	try {
		const events = await Event.getEvents(req.user)
		res.json({events})
	} catch (err) {
		console.error(err);
		res.status(500).send('Error fetching events');
	}
});

router.put('/update/:id', async (req: any, res: any) => {
	try {
		const event = await Event.updateEvent(req.params.id)
		res.json({event})
	} catch (err) {
		console.error(err);
		res.status(500).send('Error fetching report');
	}
});

export default router;