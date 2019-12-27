import express from 'express';
import moment from 'moment';
import fetch from 'node-fetch';
import 'dotenv/config';

import ControlId from './controlid';

const app = express();
app.use(express.json());


app.post('/controlid/notifications/dao', async (req, res) => {

  const { object_changes } = req.body;
  object_changes.map(async ({ object, type, values }) => {

    try {

      if (typeof values !== 'undefined') {

        const ip_device = req.ip.replace('::ffff:', '');
        const when = moment(values.time * 1000).utc().format('YYYY-MM-DD HH:mm:ss');

        const { event, user_id } = values;

        const authorized = event == 7;
        const newAccessEvent = object === 'access_logs' && type === 'inserted';

        if (newAccessEvent && authorized) {

          const device = new ControlId(ip_device, process.env.BIO_LOGIN, process.env.BIO_PASSWORD);

          await device.logon();

          const { users } = await device.getObjects('users', {
            users: { id: parseInt(user_id) }
          });

          const { registration, name } = users[0];

          const body = JSON.stringify({
            id: registration,
            name,
            when,
            ip_device
          });

          //console.log(body);

          const result = await fetch(process.env.END_POINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
          });

          const json = await result.json();

          // retorno do id inserido na tabela access_log
          if (json > 0) {
            // tudo ok :)
          }

        }

      }

    } catch (error) {
      console.log(error);
    }

  });

  return res
    .status(204)
    .json();
});

app.delete('/users/:id/', async (req, res) => {

  const { id } = req.params;
  const devices = req.body;

  const actions = devices.map(({ ip, login, password }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const leitor = new ControlId(ip, login, password);

        await leitor.logon();

        const { users } = await leitor.getObjects('users', {
          users: { registration: id }
        });

        const response = await leitor.removeObjects('templates', {
          templates: { user_id: users[0].id }
        });

        await leitor.logout();

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  });

  await Promise.all(actions);

  return res.status(200).json();
});

app.listen(3333, () => {
  console.log('Server Running');
});