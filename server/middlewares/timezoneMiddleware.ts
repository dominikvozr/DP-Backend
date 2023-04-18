/* eslint-disable @typescript-eslint/no-var-requires */
const geoip = require('geoip-lite');

export const timezoneMiddleware = (req, res, next) => {
  const ip = req.clientIp;
  const geo = geoip.lookup(ip);

  if (geo && geo.timezone) {
    req.timezone = geo.timezone;
  } else {
    // Set a default timezone if the user's timezone cannot be determined
    req.timezone = 'Europe/Bratislava';
  }
  next();
};