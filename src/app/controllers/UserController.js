import 'dotenv/config';

// import fs from 'fs';
// import path from 'path';
import Logs from '../models/logs';
import ControlId from '../../lib/controlid';
import Devices from '../models/devices';

class UserController {
  /**
   * Essa função será usada apenas para replicação dos dados entre leitores
   *
   * Acessa cada dispositivo, pega cada usuario em cada despositivo,
   * monta um array único e começa a testar cada usuario em cada dispositivo
   * caso não encontre no dispositvo, insere os dados.
   */
  async reply(req, res) {
    const fingers = req.body;
    const devices = await Devices.findAll();

    // procura por cada entity em todos dispotivos e pega suas digitais
    // await Promise.all(
    //   devices.map(async ({ ip }) => {
    //     try {
    //       const leitor = new ControlId(
    //         ip,
    //         process.env.BIO_LOGIN,
    //         process.env.BIO_PASSWORD
    //       );

    //       await leitor.logon();

    //       const { users } = await leitor.getObjects('users', {});

    //       // percorre todos usuarios desse dispositivo e pega suas digitais,
    //       // caso ja exista, passo para o proximo.
    //       await Promise.all(
    //         users.map(async ({ id, registration, name }) => {
    //           const founded = fingers.find(
    //             finger => finger.id_entity === registration
    //           );

    //           // se for diferente de undefined ja foi encontrado esse user
    //           // e nao precisa continuar
    //           if (typeof founded !== 'undefined') return;

    //           // pega as digitais do usuario
    //           const { templates } = await leitor.getObjects('templates', {
    //             templates: { user_id: id },
    //           });

    //           // busca os valores das digitais
    //           const fingerprint = templates.find(f => f.finger_type === 0);
    //           const fingerprint_emergency = templates.find(
    //             f => f.finger_type === 1
    //           );

    //           // adiciona se existir a digital
    //           fingers.push({
    //             id_entity: registration,
    //             name,
    //             fingerprint:
    //               typeof fingerprint !== 'undefined'
    //                 ? fingerprint.template
    //                 : null,
    //             fingerprint_emergency:
    //               typeof fingerprint_emergency !== 'undefined'
    //                 ? fingerprint_emergency.template
    //                 : null,
    //           });
    //         })
    //       );
    //     } catch (error) {
    //       const data = {
    //         error,
    //         ip,
    //         body: req.body,
    //         action: 'rulescontroller.store',
    //         retry: true,
    //       };

    //       await Logs.create(data);
    //     }
    //   })
    // );

    // Inicia replicação em todos dispositivos
    const resp = await Promise.all(
      fingers.map(
        async ({ fingerprint_emergency, fingerprint, id_entity, name }) => {
          await Promise.all(
            devices.map(async ({ ip }) => {
              const leitor = new ControlId(
                ip,
                process.env.BIO_LOGIN,
                process.env.BIO_PASSWORD
              );

              await leitor.logon();

              const user_id = await leitor.upInsert(
                'users',
                { users: { registration: id_entity } },
                { registration: `${id_entity}`, name }
              );

              await leitor.removeObjects('templates', {
                templates: { user_id },
              });

              const values = [];

              values.push({
                finger_position: 0,
                finger_type: 0,
                template: fingerprint,
                user_id,
              });

              if (fingerprint_emergency !== null) {
                values.push({
                  finger_position: 0,
                  finger_type: 1,
                  template: fingerprint_emergency,
                  user_id,
                });
              }

              // const insert = await leitor.newObjects('templates', values);
              await leitor.newObjects('templates', values);
              // console.log(insert);

              // adciona ao grupo padrao se não existir
              const search = await leitor.getObjects('user_groups', {
                user_groups: { user_id },
              });

              if (!search.user_groups[0]) {
                // const newInGroup = await leitor.post('create_objects.fcgi', {
                await leitor.post('create_objects.fcgi', {
                  object: 'user_groups',
                  fields: ['user_id', 'group_id'],
                  values: [
                    {
                      user_id,
                      group_id: 1,
                    },
                  ],
                });
                // console.log(newInGroup);
              }
              await leitor.logout();
            })
          );
        }
      )
    );

    return res.status(201).json(resp);
  }

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
