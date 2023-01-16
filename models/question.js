'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Question.belongsTo(models.Elections, {
        foreignKey: "electionID",
      });
      Question.hasMany(models.Options,{
        foreignKey: "questionID",
      });
    }

    static async add(title, description, electionID) {
      const res = await Question.create({
        title: title,
        description: description,
        electionID: electionID,
      });
      return res;
    }
  }
  Question.init({
    title: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};