import Sequelize, { Model } from 'sequelize';

class Devices extends Model {
  static init(sequelize) {
    super.init(
      {
        idDevice: Sequelize.STRING,
        ip: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default Devices;
