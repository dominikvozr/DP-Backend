/* eslint-disable @typescript-eslint/no-var-requires */
import * as express from 'express';
import Report from './../../models/Report';
import Test from './../../models/Test';
const router = express.Router();

router.get('/show/:id', async (req: any, res: any) => {
	try {
		res.json(Report.getReport(req.params.id))
	} catch (err) {
		console.error(err);
		res.status(500).send('Error fetching report');
	}
});

router.get('/index/test/:id', async (req: any, res: any) => {
	try {
		res.json(Report.getTestReports(req.params.id))
	} catch (err) {
		console.error(err);
		res.status(500).send('Error fetching report');
	}
});

router.post('/create', async (req: any, res: any) => {
	try {
		res.json(Report.createReport(req.body, req.user))
	} catch (err) {
		console.error(err);
		res.status(500).send('Error fetching report');
	}
});

router.put('/update', async (req: any, res: any) => {
	try {
		const test: any = await Test.findById(req.body.testId).populate({
			path: 'exam',
			populate: [
				{ path: 'user' }
			],
		})
		if (test.exam.user.id !== req.user.id) throw new Error('this test doesn\'t belong authenticated user');
		for (const id in req.body.data) {
			if (Object.prototype.hasOwnProperty.call(req.body.data, id)) {
				const response = req.body.data[id];
				await Report.updateReport({ id, response })
			}
		}
		res.json('success')
	} catch (err) {
		console.error(err);
		res.status(500).send('Error fetching report');
	}
});

export default router;