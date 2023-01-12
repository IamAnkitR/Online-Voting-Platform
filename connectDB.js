const Sequelize = require("sequelize");

const database = "postgres";
const username = "postgres";
const password = "ankit";
const sequelize = new Sequelize(database, username, password, {
  host: "127.0.0.1",
  dialect: "postgres",
  port:5432,
});

const connect = async () => {
  return sequelize.authenticate();
};

module.exports = {
  connect,
  sequelize,
};