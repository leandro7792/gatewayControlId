import 'dotenv/config';

import fs from 'fs';
import path from 'path';

import ControlId from '../../lib/controlid';

class RulesController {
  async store(req, res) {
    const idEntity = req.body.entity_id;

    // hour in miliseconds
    const hourInit =
      parseInt(req.body.cmb_alocacao_horario_inicio, 10) * 60 * 60;

    const hourEnd = parseInt(req.body.cmb_alocacao_horario_fim, 10) * 60 * 60;

    // 1 sunday, 2 monday ... 7 saturday
    const daysOfWeek = req.body.alocacao_dias_da_semana;

    console.log(req.body);

    // load all devices from the file devices.json in database folder
    const devices = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '..', '..', 'database', 'devices.json'),
        'utf-8'
      )
    );

    // // create actions in all devices to be executed together
    // const actions = devices.map(({ ip }) => {
    //   return new Promise(async (resolve, reject) => {
    //     try {
    //       const leitor = new ControlId(
    //         ip,
    //         process.env.BIO_LOGIN,
    //         process.env.BIO_PASSWORD
    //       );

    //       await leitor.logon();

    //       const { users } = await leitor.getObjects('users', {
    //         users: { registration: idEntity },
    //       });

    //       // create access rule - provider
    //       const access_rule = await leitor.newObjects('access_rules', [
    //         {
    //           name: `${idEntity} ${daysOfWeek} ${hourInit}-${hourEnd}`,
    //           type: 1,
    //           priority: 0,
    //         },
    //       ]);

    //       // console.log(users[0].id);
    //       // console.log(access_rule.ids[0]);

    //       // const user_access_rules = await leitor.newObjects(
    //       await leitor.newObjects('user_access_rules', [
    //         {
    //           user_id: users[0].id,
    //           access_rule_id: access_rule.ids[0],
    //         },
    //       ]);

    //       // console.log(user_access_rules.ids[0]);

    //       const time_zones = await leitor.newObjects('time_zones', [
    //         {
    //           name: `${idEntity} ${daysOfWeek} ${hourInit}-${hourEnd}`,
    //         },
    //       ]);

    //       // console.log(time_zones.ids[0]);

    //       const checkDayOfWeek = dayNumber =>
    //         daysOfWeek.indexOf(dayNumber) === -1 ? 0 : 1;

    //       // const time_spans = await leitor.newObjects('time_spans', [
    //       await leitor.newObjects('time_spans', [
    //         {
    //           time_zone_id: time_zones.ids[0],
    //           start: hourInit,
    //           end: hourEnd,
    //           sun: checkDayOfWeek(1),
    //           mon: checkDayOfWeek(2),
    //           tue: checkDayOfWeek(3),
    //           wed: checkDayOfWeek(4),
    //           thu: checkDayOfWeek(5),
    //           fri: checkDayOfWeek(6),
    //           sat: checkDayOfWeek(7),
    //           hol1: 0,
    //           hol2: 0,
    //           hol3: 0,
    //         },
    //       ]);

    //       // console.log(time_spans.ids[0]);

    //       // const access_rule_time_zones = await leitor.newObjects(
    //       await leitor.newObjects('access_rule_time_zones', [
    //         {
    //           access_rule_id: access_rule.ids[0],
    //           time_zone_id: time_zones.ids[0],
    //         },
    //       ]);

    //       // console.log(access_rule_time_zones.ids[0]);

    //       // const portal_access_rules = await leitor.newObjects(
    //       await leitor.newObjects('portal_access_rules', [
    //         {
    //           portal_id: 1,
    //           access_rule_id: access_rule.ids[0],
    //         },
    //       ]);

    //       // console.log(portal_access_rules);

    //       resolve(users);
    //     } catch (error) {
    //       reject(error);
    //     }
    //   });
    // });

    // await Promise.all(actions);

    return res.status(200).json();
  }
}

export default new RulesController();
