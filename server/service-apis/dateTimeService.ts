import { DateTime } from 'luxon';
import * as geoip from 'geoip-lite';
import axios from 'axios';

export default class DateTimeService {
  public static createDateObject = async (
    dateString: string,
    timeString: string,
    timezone: string,
  ): Promise<Date> => {
    // Get timezone based on IP address
    //BUG: const timezone = await this.getTimezoneByIp(ipAddress);
    console.log('asd timezone: ' + timezone);

    // Combine date and time strings
    const dateTimeString = `${dateString} ${timeString}`;
    const correctTimezone = timezone || 'Europe/Bratislava'
    console.log('correctTimezone: ' + correctTimezone);


    // Parse date and time string and set timezone
    const date = DateTime.fromFormat(dateTimeString, 'dd/MM/yyyy hh:mm')//.setZone(correctTimezone, {keepCalendarTime: true})

    // Convert to JavaScript Date object
    const jsDate = date.toJSDate();
    console.log('jsDate: ' + jsDate);
    const correctDate = new Date(
      jsDate.toLocaleString('sk-SK', {
        correctTimezone,
      }),
    );
    console.log('correctDate: ' + correctDate);
    //return jsDate;
    return correctDate
  };

  public static getTimezoneByIp = async (ipAddress: string): Promise<string> => {
    const location = geoip.lookup(ipAddress);

    if (!location) {
      throw new Error('Could not determine location from IP address.');
    }

    const apiUrl = `http://ip-api.com/json/${ipAddress}?fields=status,message,timezone`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.status === 'fail') {
      throw new Error(`Error fetching timezone: ${data.message}`);
    }

    return data.timezone;
  };
}