import Sequelize from 'sequelize';
import dabaseConfig from '../config/database';

import Devices from '../app/models/devices';

const models = [Devices];

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
