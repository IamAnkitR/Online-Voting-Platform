'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Options extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Options.belongsTo(models.Question, {
        foreignKey: "questionID",
      });
    } 
    static async add(title, questionID) {
      const res = await Options.create({
        title: title,
        questionID: questionID,
      });
      return res;
    }
  }
  Options.init({
    title: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Options',
  });
  return Options;
};