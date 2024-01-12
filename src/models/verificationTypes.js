const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  var VerificationTypes = sequelize.define('VerificationTypes', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    marksheet: {
      type: DataTypes.BOOLEAN
    },
    noOfMarksheet: {
      type: DataTypes.INTEGER
    },
    transcript: {
      type: DataTypes.BOOLEAN
    },
    noOfTranscript: {
      type: DataTypes.INTEGER
    },
    degreeCertificate: {
      type: DataTypes.BOOLEAN
    },
    noOfDegree: {
      type: DataTypes.INTEGER
    },
    sealedCover: {
      type: DataTypes.BOOLEAN
    },
    noOfCopies: {
      type: DataTypes.INTEGER
    },
    secondYear: {
      type: DataTypes.BOOLEAN
    },
    marksheetData: {
      type: DataTypes.BOOLEAN
    },
    degree_Type: {
      type: DataTypes.STRING(255)
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    user_id_byAgent: {
      type: DataTypes.INTEGER
    },
    app_id : {
      type : DataTypes.TEXT
    },
    source_from:{
      type:DataTypes.TEXT
    }
  }, {
    sequelize,
    tableName: 'VerificationTypes',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  VerificationTypes.setAppId = function(user_id,app_id){
    var query = "UPDATE VerificationTypes SET app_id = " + app_id + " WHERE app_id = null AND user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  return VerificationTypes;

};
