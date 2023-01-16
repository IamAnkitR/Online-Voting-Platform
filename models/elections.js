'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Elections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Elections.belongsTo(models.Admins, {
        foreignKey: "adminID",
      });
      Elections.hasMany(models.Question, {
        foreignKey: "electionID",
      });
    }

    static async add(adminID, name) {
      const res = await Elections.create({
        adminID: adminID,
        name: name,
        started: false,
        ended: false,
      });
      return res;
    }
  }
  Elections.init({
    name: DataTypes.STRING,
    started: DataTypes.BOOLEAN,
    ended: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Elections',
  });
  return Elections;
};