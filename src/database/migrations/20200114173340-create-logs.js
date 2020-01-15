module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      error: {
        type: Sequelize.JSON,
      },
      ip: {
        type: Sequelize.STRING,
      },
      body: {
        type: Sequelize.JSON,
      },
      action: {
        type: Sequelize.STRING,
      },
      retry: {
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: queryInterface => {
    return queryInterface.dropTable('logs');
  },
};
