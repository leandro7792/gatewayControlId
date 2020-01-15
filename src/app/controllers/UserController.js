// import 'dotenv/config';

// import fs from 'fs';
// import path from 'path';
import Logs from '../models/logs';
import ControlId from '../../lib/controlid';

class UserController {
  async remove(req, res) {
    const { id } = req.params;
    // const devices = JSON.parse(
    //   fs.readFileSync(
    //     path.resolve(__dirname, '..', '..', 'database', 'devices.json'),
    //     'utf-8'
    //   )
    // );

    const devices = req.body;

    const actions = devices.map(({ ip, login, password }) => {
      return new Promise(async (resolve, reject) => {
        try {
          // const leitor = new ControlId(
          //   ip,
          //   process.env.BIO_LOGIN,
          //   process.env.BIO_PASSWORD
          // );
          const leitor = new ControlId(ip, login, password);

          await leitor.logon();

          const { users } = await leitor.getObjects('users', {
            users: { registration: id },
          });

          const response = await leitor.removeObjects('templates', {
            templates: { user_id: users[0].id },
          });

          await leitor.logout();

          resolve(response);
        } catch (error) {
          const data = {
            error,
            ip,
            body: req.body,
            action: 'usercontroller.remove',
            retry: true,
          };

          await Logs.create(data);
          resolve();
        }
      });
    });

    await Promise.all(actions);

    return res.status(200).json();
  }
}

export default new UserController();
