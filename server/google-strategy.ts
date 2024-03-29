import * as passport from 'passport';
import { OAuth2Strategy } from 'passport-google-oauth';
import { createOrUpdateGiteaUser } from './gitea-auth';
import User, { UserDocument } from './models/User';
// eslint-disable-next-line
require('dotenv').config();

const setupGoogleOAuth = ({ server }) => {
   if (!process.env.GOOGLE_CLIENT_ID) {
      return;
    }

  const verify = async (accessToken, refreshToken, profile, done) => {
    let email;
    let avatarUrl;

    if (profile.emails) {
      email = profile.emails[0].value;
    }

    if (profile.photos && profile.photos.length > 0) {
      avatarUrl = profile.photos[0].value.replace('sz=50', 'sz=128');
    }

    try {
      const gitea = await createOrUpdateGiteaUser(email, profile.displayName);
      const user = await User.signInOrSignUpViaGoogle({
        googleId: profile.id,
        email,
        googleToken: { accessToken, refreshToken },
        displayName: profile.displayName,
        avatarUrl,
        gitea
      });

      done(null, user);
    } catch (err) {
      done(err);
      console.error(err);
    }
  };

  passport.use(new OAuth2Strategy({
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.URL_API + '/auth/google/callback'
      }, verify
  ));

  passport.serializeUser((user: UserDocument, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, User.publicFields(), (err, user) => {
      done(err, user);
    });
  });

  server.use(passport.initialize());
  server.use(passport.session());

  server.get('/server/auth/google', (req, res, next) => {
    const options = {
      scope: ['profile', 'email'],
      prompt: 'select_account',
    };

    passport.authenticate('google', options)(req, res, next);
  });

  server.get('/server/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/server/login' }),
    (req, res) => {
    req.session.giteaAccessToken = req.user.gitea.accessToken.sha1;

    res.redirect(`${process.env.URL_APP}/`);
  });
}

export { setupGoogleOAuth }