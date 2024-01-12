"use strict";

module.exports = function(sequelize, DataTypes) {
  var Applicant_Marksheet = sequelize.define("Applicant_Marksheet", {
    name: DataTypes.TEXT,
  	file_name: DataTypes.TEXT,
    type: DataTypes.STRING(30),
    lock_transcript: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
    user_id :  DataTypes.STRING(30),
    marksheet_for : DataTypes.ENUM('Degree', 'Masters'),
    collegeId :  DataTypes.STRING(30),
    emailMsgId : DataTypes.TEXT,
    collegeEmailStatus : DataTypes.STRING(20),
    upload_step: {
      type: DataTypes.ENUM('default', 'requested','changed'),
      allowNull: false,
      defaultValue: 'default'
    },
    errata_msg :  DataTypes.STRING(500),
    reason : DataTypes.STRING(500),
    applied_for_degree:DataTypes.STRING(400),
    app_id : DataTypes.STRING(50),
    source:  DataTypes.STRING(30)
  }, {

    sequelize,
    tableName: 'Applicant_Marksheet',
    timestamps: true,
    createdAt: "created_at", // alias createdAt as created_at
    updatedAt: "updated_at", 
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

  Applicant_Marksheet.updateSingleCollegeEmailStatus = function(user_id,college_id, msgID,value){
    var query = "Update Applicant_Marksheet set collegeEmailStatus = '" + value + "', emailMsgId='" + msgID +"' where user_id = " + user_id +" and name = 'Transfer Certificate'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  Applicant_Marksheet.getRequestedDocu = function(user_id) {
    var query = "SELECT name from Applicant_Marksheet WHERE upload_step = 'requested' AND user_id ="+ user_id ;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Applicant_Marksheet.getChangedDocu = function(user_id) {
    var query = "SELECT name from Applicant_Marksheet WHERE upload_step = 'changed' AND user_id ="+ user_id ;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Applicant_Marksheet.getRequestedDocCron = function(file_name) {
    var query = "select CONCAT(u.name,' ',u.surname)as name, u.email as email, am.name as file_name, am.errata_msg, a.id as app_id, u.id from Application as a JOIN User as u on u.id=a.user_id JOIN Applicant_Marksheet as am on am.user_id=u.id where a.tracker='apply' and am.name ='"+file_name+"' and am.upload_step='requested'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Applicant_Marksheet.getUploadedDoc = function(user_id){
    var query = 'Select GROUP_CONCAT(name) as doc from Applicant_Marksheet where user_id ='+user_id ;
    return sequelize.query(query , {type:sequelize.QueryTypes.SELECT});
  }

  Applicant_Marksheet.associate = (models) => {
    Applicant_Marksheet.belongsTo(models.User, {foreignKey: 'user_id'});
  //User.belongsTo(models.Country, {foreignKey: 'country_id'});
  };

  Applicant_Marksheet.getUploadedBonafied = function(user_id,type){
    var query = "SELECT id, name,created_at,updated_at, file_name, type, lock_transcript, app_id,source,";
    query += "upload_step,  id,user_id FROM Applicant_Marksheet WHERE user_id  =" + user_id + "  AND (type like'%" + type + "%'"  + "  OR name like'%" + type + "%')"; 
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  return Applicant_Marksheet;
};
