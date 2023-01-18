import * as express from 'express';
import User from './../models/User';

const router = express.Router();

router.get('/get-user', async (req, res, next) => {
  try {
    res.json({ user: req.user || null });
  } catch (err) {
    next(err);
  }
});

router.get('/get-user-by-slug', async (_req, res, next) => {
  console.log('Express route');
  try {
    //const { slug } = req.body;

    const user = await User.getUserBySlug({ slug: 'student-code' });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/update-profile', async (req, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    const userId = 'someString';

    const updatedUser = await User.updateProfile({
      userId,
      name,
      avatarUrl,
    });

    res.json({ updatedUser });
  } catch (err) {
    next(err);
  }
});

router.post('/toggle-theme', async (req: any, res, next) => {
  try {
    const { darkTheme } = req.body;

    await User.toggleTheme({ userId: req.user.id, darkTheme });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

export default router;
