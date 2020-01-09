import 'dotenv/config';
import moment from 'moment';
import fetch from 'node-fetch';
import Devices from '../models/devices';
import ControlId from '../../lib/controlid';

class LogController {
  async store(req, res) {
    const { object_changes } = req.body;

    object_changes.map(async ({ object, type, values }) => {
      if (typeof values !== 'undefined') {
        // const ip_device = req.ip.replace('::ffff:', '');

        const reader = await Devices.findOne({
          where: { idDevice: values.device_id },
        });

        // console.log(reader.ip);

        const when = moment(values.time * 1000)
          .utc()
          .format('YYYY-MM-DD HH:mm:ss');

        const { event, user_id } = values;
        const authorized = event === '7';
        const newAccessEvent = object === 'access_logs' && type === 'inserted';

        if (newAccessEvent && authorized) {
          const device = new ControlId(
            reader.ip,
            process.env.BIO_LOGIN,
            process.env.BIO_PASSWORD
          );

          await device.logon();

          const { users } = await device.getObjects('users', {
            users: { id: parseInt(user_id, 10) },
          });

          const { registration, name } = users[0];

          const body = JSON.stringify({
            id: registration,
            name,
            when,
            ip_device: reader.ip,
          });

          // console.log(body);

          const result = await fetch(process.env.END_POINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          });

          // console.log(result);

          const json = await result.json();

          // retorno do id inserido na tabela access_log
          if (json > 0) {
            // tudo ok :)
          }
        }
      }
    });
    return res.status(204).json();
  }
}

export default new LogController();
