'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class questions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) { 
        // define association here
        questions.belongsTo(models.Elections, {
          foreignKey: "electionID",
        });
      }
  
      static async add(title, description, electionID) {
        const res = await questions.create({
          title: title,
          desctiption: description,
          electionID: electionID,
        });
        return res;
    }
  }
  questions.init({
    title: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'questions',
  });
  return questions;
};