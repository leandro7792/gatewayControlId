import Sequelize, { Model } from 'sequelize';

class Logs extends Model {
  static init(sequelize) {
    super.init(
      {
        error: Sequelize.JSON,
        ip: Sequelize.STRING,
        body: Sequelize.JSON,
        action: Sequelize.STRING,
        retry: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default Logs;
