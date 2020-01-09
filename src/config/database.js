const { resolve } = require('path');

module.exports = {
  dialect: 'sqlite',
  storage: resolve(__dirname, '..', 'database', 'database.sqlite3'),
};
