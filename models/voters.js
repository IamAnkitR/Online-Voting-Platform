'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Voters.belongsTo(models.Elections,{
        foreignKey: "electionID",
      });
    }
  static async add(voterID, password, electionID) {
    const res = await Voters.create({
      voterID: voterID,
      password: password,
      electionID: electionID,
      status: false,
      responses: [],
    });
    return res;
  }

  static async delete(voterID) {
    const res = await Voters.destroy({
      where: {
        id: voterID,
      },
    });
    return res;
  }
  static async voted(id) {
    const res = await Voters.update(
      {
        status: true,
      },
      {
        where: {
          id: id,
        },
      }
    );
    return res;
  }
  static async addResponse(id, response) {
    const res = await Voters.update(
      {
        responses: response,
      },
      {
        where: {
          id: id,
        },
      }
    );
    return res;
  }
}
  Voters.init({
    voterID: DataTypes.STRING,
    password: DataTypes.STRING,
    status: DataTypes.BOOLEAN,
    responses: DataTypes.ARRAY(DataTypes.INTEGER),
  }, {
    sequelize,
    modelName: 'Voters',
  });
  return Voters;
};