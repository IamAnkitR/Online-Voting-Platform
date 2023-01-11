'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Election.belongsTo(models.Admin, {
        foreignKey: "adminID",
      });
    }
    static async add(adminID, name) {
      const res = await Election.create({
        adminID: adminID,
        name: name,
        started: false,
        ended: false,
      });
      return res;
    }
  }
  Election.init({
    name: DataTypes.STRING,
    started: DataTypes.BOOLEAN,
    ended: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Election',
  });
  return Election;
};