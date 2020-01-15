import 'dotenv/config';
import moment from 'moment';
import Devices from '../models/devices';
import Logs from '../models/logs';
import ControlId from '../../lib/controlid';

// return new Buffer.from(data, 'base64');

class RulesController {
  async store(req, res) {
    const {
      entity_id: idEntity,
      unidades_selecionadas: units,
      alocacao_dias_da_semana: daysOfWeek, // 1 sunday, 2 monday ... 7 saturday
      cmb_alocacao_horario_inicio: hourInit,
      cmb_alocacao_horario_fim: hourEnd,
      txt_alocacao_data_inicio: dateInit,
      txt_alocacao_data_fim: dateEnd,
    } = req.body;

    // console.log(req.body);

    // hour in miliseconds
    const hourInitUnix = parseInt(hourInit, 10) * 60 * 60;
    const hourEndUnix =
      hourEnd === '24'
        ? 86399 // 23:59:59
        : parseInt(hourEnd, 10) * 60 * 60;

    // period
    const dateStartUnix = moment(`${dateInit} ${hourInit}:00+0000`).unix();
    const dateEndUnix = moment(`${dateEnd} ${hourEnd}:00+0000`).unix();

    // console.log(req.body);

    const devices = await Devices.findAll();
    // console.log(units);
    const unitsArray = units.split(',');
    unitsArray.pop(); // remove ultimo elemeto (vazio)
    // console.log(unitsArray);

    // create actions in all devices to be executed together
    const actions = unitsArray.map(unit =>
      devices.map(({ ip }) => {
        return new Promise(async (resolve, reject) => {
          try {
            const leitor = new ControlId(
              ip,
              process.env.BIO_LOGIN,
              process.env.BIO_PASSWORD
            );

            await leitor.logon();

            // get the user info
            const { users } = await leitor.getObjects('users', {
              users: { registration: idEntity },
            });

            // remove high access level (cause him's in the group of residents)
            await leitor.removeObjects('user_groups', {
              user_groups: { user_id: users[0].id },
            });

            // ###### TODO:
            // converter inicio e fim em timestamp #DONE
            // gravar nos campos begin_time e end_time da tabela users do leitor #DONE
            // achar uma maneira de não sobrescrever as informações, caso seja -
            // gerado um novo periodo (o.O)^> #DONE uhuuuuuu

            // define the validate of the user
            const where = {
              users: { registration: users[0].registration },
            };

            const data = {};

            // validations
            const now = moment
              .utc()
              .subtract(3, 'hours')
              .unix();

            const fieldsEmptys =
              users[0].end_time === '' && users[0].end_time === '';

            const alreadyPast =
              users[0].end_time <= dateStartUnix && users[0].end_time <= now;

            if (fieldsEmptys) {
              data.begin_time = dateStartUnix;
              data.end_time = dateEndUnix;
            } else if (alreadyPast) {
              data.begin_time = dateStartUnix;
              data.end_time = dateEndUnix;
            } else {
              const priorTask = users[0].begin_time > dateStartUnix;
              const finishLater = users[0].end_time < dateEndUnix;

              if (priorTask) data.begin_time = dateStartUnix;
              if (finishLater) data.end_time = dateEndUnix;
            }

            if (JSON.stringify(data) !== '{}') {
              await leitor.updateObjects('users', where, data);
            }
            // ###### end TODO:

            // create access rule - provider
            const access_rule = await leitor.newObjects('access_rules', [
              {
                name: `SP:${idEntity} U:${unit} P:${dateInit} ${hourInit}:00:00/${dateEnd} ${hourEnd}:00:00`,
                type: 1,
                priority: 0,
              },
            ]);
            // console.log(
            //   `SP:${idEntity} U:${unit} P:${dateInit} ${hourInit}:00:00/${dateEnd} ${hourEnd}:00:00`
            // );
            // console.log(users[0].id);
            // console.log(access_rule.ids[0]);

            // const user_access_rules = await leitor.newObjects(
            await leitor.newObjects('user_access_rules', [
              {
                user_id: users[0].id,
                access_rule_id: access_rule.ids[0],
              },
            ]);
            // console.log(user_access_rules.ids[0]);

            const time_zones = await leitor.newObjects('time_zones', [
              {
                name: `SP:${idEntity} U:${unit} P:${dateInit} ${hourInit}:00:00/${dateEnd} ${hourEnd}:00:00`,
              },
            ]);
            // console.log(time_zones.ids[0]);

            const checkDayOfWeek = dayNumber =>
              daysOfWeek.indexOf(dayNumber) === -1 ? 0 : 1;

            // const time_spans = await leitor.newObjects('time_spans', [
            await leitor.newObjects('time_spans', [
              {
                time_zone_id: time_zones.ids[0],
                start: hourInitUnix,
                end: hourEndUnix,
                sun: checkDayOfWeek(1),
                mon: checkDayOfWeek(2),
                tue: checkDayOfWeek(3),
                wed: checkDayOfWeek(4),
                thu: checkDayOfWeek(5),
                fri: checkDayOfWeek(6),
                sat: checkDayOfWeek(7),
                hol1: 0,
                hol2: 0,
                hol3: 0,
              },
            ]);
            // console.log(time_spans.ids[0]);

            // const access_rule_time_zones = await leitor.newObjects(
            await leitor.newObjects('access_rule_time_zones', [
              {
                access_rule_id: access_rule.ids[0],
                time_zone_id: time_zones.ids[0],
              },
            ]);
            // console.log(access_rule_time_zones.ids[0]);

            // const portal_access_rules = await leitor.newObjects(
            await leitor.newObjects('portal_access_rules', [
              {
                portal_id: 1,
                access_rule_id: access_rule.ids[0],
              },
            ]);
            // console.log(portal_access_rules);

            resolve(users);
          } catch (error) {
            const data = {
              error,
              ip,
              body: req.body,
              action: 'rulescontroller.store',
              retry: true,
            };

            await Logs.create(data);
            reject(error);
          }
        });
      })
    );

    await Promise.all(actions);

    return res.status(200).json();
  }

  async remove(req, res) {
    const {
      entity_id: idEntity,
      permission: {
        date_start: dateInit,
        date_end: dateEnd,
        unity_id: unit,
        hour_start: hourInit,
        hour_end: hourEnd,
      },
    } = req.body;

    // const post = req.body;
    // console.log('delete');
    // console.log(post);

    const devices = await Devices.findAll();

    const actions = devices.map(({ ip }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const leitor = new ControlId(
            ip,
            process.env.BIO_LOGIN,
            process.env.BIO_PASSWORD
          );

          await leitor.logon();

          const { users } = await leitor.getObjects('users', {
            users: { registration: idEntity },
          });
          // console.log(users[0].id);

          const { access_rules } = await leitor.getObjects('access_rules', {
            access_rules: {
              name: `SP:${idEntity} U:${unit} P:${dateInit} ${hourInit}/${dateEnd} ${hourEnd}`,
            },
          });
          // console.log(
          //   `SP:${idEntity} U:${unit} P:${dateInit} ${hourInit}/${dateEnd} ${hourEnd}`
          // );
          // console.log(access_rules);

          const { time_zones } = await leitor.getObjects('time_zones', {
            time_zones: {
              name: `SP:${idEntity} U:${unit} P:${dateInit} ${hourInit}/${dateEnd} ${hourEnd}`,
            },
          });
          // console.log(time_zones);

          // const portal_access_rules = await leitor.removeObjects(
          await leitor.removeObjects('portal_access_rules', {
            portal_access_rules: {
              access_rule_id: access_rules[0].id,
            },
          });
          // console.log(portal_access_rules);

          // const access_rule_time_zones = await leitor.removeObjects(
          await leitor.removeObjects('access_rule_time_zones', {
            access_rule_time_zones: {
              access_rule_id: access_rules[0].id,
            },
          });
          // console.log(access_rule_time_zones);

          // const time_spans = await leitor.removeObjects('time_spans', {
          await leitor.removeObjects('time_spans', {
            time_spans: {
              time_zone_id: time_zones[0].id,
            },
          });
          // console.log(time_spans);

          // const time_zones_exclude = await leitor.removeObjects('time_zones', {
          await leitor.removeObjects('time_zones', {
            time_zones: {
              id: time_zones[0].id,
            },
          });
          // console.log(time_zones_exclude);

          // const user_access_rules = await leitor.removeObjects(
          await leitor.removeObjects('user_access_rules', {
            user_access_rules: {
              user_id: users[0].id,
              access_rule_id: access_rules[0].id,
            },
          });
          // console.log(user_access_rules);

          // const access_rules_exclude = await leitor.removeObjects(
          await leitor.removeObjects('access_rules', {
            access_rules: {
              id: access_rules[0].id,
            },
          });
          // console.log(access_rules_exclude);

          resolve();
        } catch (error) {
          const data = {
            error,
            ip,
            body: req.body,
            action: 'rulescontroller.remove',
            retry: true,
          };

          await Logs.create(data);
          reject(error);
        }
      });
    });

    await Promise.all(actions);

    return res.status(200).json();
  }

  async update(req, res) {
    // console.log('update');
    // console.log(req.body);

    const {
      entity_id: idEntity,
      alocacao_dias_da_semana: daysOfWeek, // 1 sunday, 2 monday ... 7 saturday
      cmb_alocacao_horario_inicio: hourInit,
      cmb_alocacao_horario_fim: hourEnd,
      txt_alocacao_data_inicio: dateInit,
      txt_alocacao_data_fim: dateEnd,
      permission: {
        date_start: dateInitOld,
        date_end: dateEndOld,
        unity_id: unit,
        hour_start: hourInitOld,
        hour_end: hourEndOld,
      },
    } = req.body;

    const devices = await Devices.findAll();

    const actions = devices.map(({ ip }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const leitor = new ControlId(
            ip,
            process.env.BIO_LOGIN,
            process.env.BIO_PASSWORD
          );

          await leitor.logon();

          const { users } = await leitor.getObjects('users', {
            users: { registration: idEntity },
          });
          // console.log(users);

          const { time_zones } = await leitor.getObjects('time_zones', {
            time_zones: {
              name: `SP:${idEntity} U:${unit} P:${dateInitOld} ${hourInitOld}/${dateEndOld} ${hourEndOld}`,
            },
          });

          // console.log(time_zones);

          let where = {
            time_zones: { id: time_zones[0].id },
          };

          let data = {
            name: `SP:${idEntity} U:${unit} P:${dateInit} ${hourInit}:00:00/${dateEnd} ${hourEnd}:00:00`,
          };

          // console.log(data);

          // const time_zones_upd = await leitor.updateObjects(
          await leitor.updateObjects('time_zones', where, data);

          // console.log(time_zones_upd);

          const { access_rules } = await leitor.getObjects('access_rules', {
            access_rules: {
              name: `SP:${idEntity} U:${unit} P:${dateInitOld} ${hourInitOld}/${dateEndOld} ${hourEndOld}`,
            },
          });

          // console.log(access_rules);

          where = {
            access_rules: { id: access_rules[0].id },
          };

          // data = {
          //   name: `SP:${idEntity} U:${unit} P:${dateInit} ${hourInit}:00:00/${dateEnd} ${hourEnd}:00:00`,
          // };

          // console.log(data);

          // const access_rules_upd = await leitor.updateObjects(
          await leitor.updateObjects('access_rules', where, data);

          // console.log('access_rules_upd');
          // console.log(access_rules_upd);

          // criando update
          //* **************************************************************** */

          // hour in miliseconds
          const hourInitUnix = parseInt(hourInit, 10) * 60 * 60;
          const hourEndUnix =
            hourEnd === '24'
              ? 86399 // 23:59:59
              : parseInt(hourEnd, 10) * 60 * 60;

          // period
          const dateStartUnix = moment(
            `${dateInit} ${hourInit}:00+0000`
          ).unix();
          const dateEndUnix = moment(`${dateEnd} ${hourEnd}:00+0000`).unix();

          // console.log(`dateStartUnix ${dateStartUnix}`);
          // console.log(`dateEndUnix ${dateEndUnix}`);

          where = {
            users: { registration: users[0].registration },
          };

          data = {};

          // validations
          const now = moment
            .utc()
            .subtract(3, 'hours')
            .unix();

          const fieldsEmptys =
            users[0].end_time === '' && users[0].end_time === '';

          // console.log(`empty ${fieldsEmptys}`);

          const alreadyPast =
            users[0].end_time <= dateStartUnix && users[0].end_time <= now;
          // console.log(`past ${alreadyPast}`);

          if (fieldsEmptys) {
            data.begin_time = dateStartUnix;
            data.end_time = dateEndUnix;
          } else if (alreadyPast) {
            data.begin_time = dateStartUnix;
            data.end_time = dateEndUnix;
          } else {
            const priorTask = users[0].begin_time > dateStartUnix;
            const finishLater = users[0].end_time < dateEndUnix;

            // console.log(`priorTask ${priorTask}`);
            // console.log(`finishLater ${finishLater}`);

            if (priorTask) data.begin_time = dateStartUnix;
            if (finishLater) data.end_time = dateEndUnix;
          }

          if (JSON.stringify(data) !== '{}') {
            await leitor.updateObjects('users', where, data);
          }

          /**
           *  alterando time_span
           *
           */

          const checkDayOfWeek = dayNumber =>
            daysOfWeek.indexOf(dayNumber) === -1 ? 0 : 1;

          data = {
            start: hourInitUnix,
            end: hourEndUnix,
            sun: checkDayOfWeek(1),
            mon: checkDayOfWeek(2),
            tue: checkDayOfWeek(3),
            wed: checkDayOfWeek(4),
            thu: checkDayOfWeek(5),
            fri: checkDayOfWeek(6),
            sat: checkDayOfWeek(7),
            hol1: 0,
            hol2: 0,
            hol3: 0,
          };

          where = {
            time_spans: { time_zone_id: time_zones[0].id },
          };

          // const time_spans = await leitor.updateObjects(
          await leitor.updateObjects('time_spans', where, data);

          // console.log(time_spans);

          resolve();
        } catch (error) {
          const data = {
            error,
            ip,
            body: req.body,
            action: 'rulescontroller.update',
            retry: true,
          };

          await Logs.create(data);
          reject(error);
        }
      });
    });

    await Promise.all(actions);

    return res.status(200).json();
  }
}

export default new RulesController();
