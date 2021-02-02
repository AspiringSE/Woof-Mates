const Sequelize = require('sequelize');
const db = new Sequelize(process.env.DATABASE_URL || "postgres://localhost:5432/woofmates", { logging: false,
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false,
  }
}
});

module.exports = db;
