import { DateTime } from 'luxon';
import geoip from 'geoip-lite';
import request from 'request-promise';

export default class DateTimeService {
  public static createDateObject = async (
    dateString: string,
    timeString: string,
    ipAddress: string
  ): Promise<Date> => {
    // Get timezone based on IP address
    const timezone = await this.getTimezoneByIp(ipAddress);
    console.log(dateString);
    console.log(timeString);

    // Combine date and time strings
    const dateTimeString = `${dateString} ${timeString}`;

    // Parse date and time string and set timezone
    const date = DateTime.fromFormat(dateTimeString, 'dd/MM/yyyy hh:mm', {
      zone: timezone,
    });

    // Convert to JavaScript Date object
    const jsDate = date.toJSDate();

    return jsDate;
  };

  public static getTimezoneByIp = async (ipAddress: string): Promise<string> => {
    const location = geoip.lookup(ipAddress);

    if (!location) {
      throw new Error('Could not determine location from IP address.');
    }

    const apiUrl = `http://ip-api.com/json/${ipAddress}?fields=status,message,timezone`;
    const response = await request(apiUrl);
    const data = JSON.parse(response);

    if (data.status === 'fail') {
      throw new Error(`Error fetching timezone: ${data.message}`);
    }

    return data.timezone;
  };
}