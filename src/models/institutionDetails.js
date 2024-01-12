const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  var InstituteDetails = sequelize.define('InstituteDetails', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    referenceNo: {
      type: DataTypes.STRING(100)
    },
    name: {
      type: DataTypes.TEXT
    },
    address: {
      type: DataTypes.JSON
    },
    student_address:{
      type: DataTypes.TEXT
    },
    email:{
      type: DataTypes.STRING(50)
    },
    deliveryOption:{
      type : DataTypes.STRING(50)
    },
    deliveryMode : {
      type : DataTypes.STRING(50)
    },
    type:{
      type: DataTypes.STRING(50)
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
    emailasperwes :{
      type : DataTypes.STRING(255)
    },
    nameasperwes :{
      type : DataTypes.STRING(255)
    },
    surnameasperwes :{
      type : DataTypes.STRING(255)
    }
    
  }, {
    sequelize,
    tableName: 'InstituteDetails',
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

  InstituteDetails.setAppId = function(user_id,app_id){
    var query = "UPDATE InstituteDetails SET app_id = " + app_id + " WHERE app_id is null AND user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  InstituteDetails.removeEmailOrAddress = function(user_id,column){
    var query = '';
    if(column == 'email'){
      query = "UPDATE InstituteDetails SET email = null, deliveryOption = null WHERE app_id is null AND user_id = " + user_id;
    }else if(column == 'address'){
      query = "UPDATE InstituteDetails SET address = null,deliveryOption = null WHERE app_id is null AND user_id = " + user_id;
    }
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  InstituteDetails.deleteOthers = function(user_id,type,limit){

    var query = "DELETE FROM InstituteDetails WHERE app_id is null AND user_id = " + user_id + " AND type = '" + type + "' ";
    query +=" ORDER BY id DESC limit " + limit;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }

  return InstituteDetails;

};
