import Sequelize from 'sequelize';
import dabaseConfig from '../config/database';

import Devices from '../app/models/devices';
import Logs from '../app/models/logs';

const models = [Devices, Logs];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(dabaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();
