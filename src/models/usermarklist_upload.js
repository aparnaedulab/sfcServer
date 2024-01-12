"use strict";

module.exports = function(sequelize, DataTypes) {
  var UserMarklist_Upload = sequelize.define("UserMarklist_Upload", {
    name: DataTypes.TEXT,
    file_name: DataTypes.TEXT,
    education_type:DataTypes.STRING(30),
    lock_transcript: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
    upload_step: {
      type: DataTypes.ENUM('default', 'requested','changed'),
      allowNull: false,
      defaultValue: 'default'
    },
    verify_doc: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    }, 
    app_id : DataTypes.STRING(30),
    source:  DataTypes.STRING(30)
  },{
    sequelize,
    tableName: 'UserMarklist_Upload',
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

  UserMarklist_Upload.getMarksheetData = function(userMarklistId){
    var query = '';
     if(userMarklistId !=undefined || userMarklistId!=''){
        query += " SELECT uUpload.id,uUpload.user_id,uUpload.name,uUpload.file_name,";
        query += " uUpload.education_type, uUpload.app_id, uUpload.lock_transcript,";
        query += " uUpload.user_marklist_id,uUpload.created_at,uUpload.updated_at, ";
        query += " user.id as usermarklist_id,user.name as usermarklist_name,";
        query += " user.user_id as usermarklist_user_id,user.type,user.faculty,user.patteren,";
        query += " user.file_name as usermarklist_file_name,user.lock_marklist as user_lock_marklist,";
        query += " user.collegeId,user.created_at as usermarklist_created_at,";
        query += " user.updated_at as usermarklist_updated_at From UserMarklist_Upload as uUpload ";
        query += " LEFT JOIN userMarkList as user on user.id = uUpload.user_marklist_id";
        query += " where uUpload.user_id="+userMarklistId;
     }
     return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  }

  UserMarklist_Upload.getBachelorsMarksheetData = function(userMarklistId){
    var query = '';
   if(userMarklistId !=undefined || userMarklistId!=''){
    query += " SELECT uUpload.id,uUpload.user_id,uUpload.name,uUpload.file_name,uUpload.education_type,uUpload.lock_transcript,uUpload.user_marklist_id,uUpload.created_at,uUpload.updated_at, ";
    query += " user.id as usermarklist_id,user.name as usermarklist_name,user.user_id as usermarklist_user_id,user.type,user.faculty,user.patteren,user.file_name as usermarklist_file_name,user.lock_marklist as user_lock_marklist,user.collegeId,user.created_at as usermarklist_created_at,user.updated_at as usermarklist_updated_at ";
    query += " From UserMarklist_Upload as uUpload RIGHT JOIN userMarkList as user on user.id = uUpload.user_marklist_id where user.user_id="+userMarklistId;
    query += " AND (user.type='Bachelors' OR uUpload.education_type='Bachelors') ";
  }
     return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  }

  UserMarklist_Upload.getMastersMarksheetData = function(userMarklistId){
    var query = '';
   if(userMarklistId !=undefined || userMarklistId!=''){
    query += " SELECT uUpload.id,uUpload.user_id,uUpload.name,uUpload.file_name,uUpload.education_type,uUpload.lock_transcript,uUpload.user_marklist_id,uUpload.created_at,uUpload.updated_at, ";
    query += " user.id as usermarklist_id,user.name as usermarklist_name,user.user_id as usermarklist_user_id,user.type,user.faculty,user.patteren,user.file_name as usermarklist_file_name,user.lock_marklist as user_lock_marklist,user.collegeId,user.created_at as usermarklist_created_at,user.updated_at as usermarklist_updated_at ";
    query += " From UserMarklist_Upload as uUpload RIGHT JOIN userMarkList as user on user.id = uUpload.user_marklist_id where user.user_id="+userMarklistId;
    query += " AND (user.type='Masters' OR uUpload.education_type='Masters') ";
  }
     return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  }

  UserMarklist_Upload.getPhdMarksheetData = function(userMarklistId){
    var query = '';
   if(userMarklistId !=undefined || userMarklistId!=''){
    query += " SELECT uUpload.id,uUpload.user_id,uUpload.name,uUpload.file_name,uUpload.education_type,uUpload.lock_transcript,uUpload.user_marklist_id,uUpload.created_at,uUpload.updated_at, ";
    query += " user.id as usermarklist_id,user.name as usermarklist_name,user.user_id as usermarklist_user_id,user.type,user.faculty,user.patteren,user.file_name as usermarklist_file_name,user.lock_marklist as user_lock_marklist,user.collegeId,user.created_at as usermarklist_created_at,user.updated_at as usermarklist_updated_at ";
    query += " From UserMarklist_Upload as uUpload RIGHT JOIN userMarkList as user on user.id = uUpload.user_marklist_id where user.user_id="+userMarklistId;
    query += " AND (user.type='PhD' OR uUpload.education_type='PhD') ";
  }
     return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  }

  UserMarklist_Upload.getMarksheetDataSendToCollege = function(userMarklistId,collegeId){
    var query = '';
     if((userMarklistId !=undefined || userMarklistId!='undefined') && (collegeId !=undefined || collegeId !='undefined')){
        query += " SELECT uUpload.id,uUpload.user_id,uUpload.name,uUpload.file_name,uUpload.education_type,uUpload.lock_transcript,uUpload.user_marklist_id,uUpload.created_at,uUpload.updated_at, ";
        query += " user.id as usermarklist_id,user.name as usermarklist_name,user.user_id as usermarklist_user_id,user.type,user.faculty,user.patteren,user.file_name as usermarklist_file_name,user.lock_marklist as user_lock_marklist,user.collegeId,user.created_at as usermarklist_created_at,user.updated_at as usermarklist_updated_at, ";
        query += " uUpload.app_id From UserMarklist_Upload as uUpload RIGHT JOIN userMarkList as user on user.id = uUpload.user_marklist_id where user.user_id="+userMarklistId;
        query += " AND user.collegeId="+collegeId;
      }
     return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  UserMarklist_Upload.getMarksheetDataSendToInstitute = function(userMarklistId){
    var query = '';
     if((userMarklistId !=undefined || userMarklistId!='undefined')){
        query += " SELECT uUpload.id,uUpload.user_id,uUpload.name,uUpload.file_name,uUpload.education_type,uUpload.lock_transcript,uUpload.user_marklist_id,uUpload.created_at,uUpload.updated_at, ";
        query += " user.id as usermarklist_id,user.name as usermarklist_name,user.user_id as usermarklist_user_id,user.type,user.faculty,user.patteren,user.file_name as usermarklist_file_name, ";
        query += " user.lock_marklist as user_lock_marklist,user.collegeId,user.created_at as usermarklist_created_at,user.updated_at as usermarklist_updated_at, ";
        query += " uUpload.app_id From UserMarklist_Upload as uUpload RIGHT JOIN userMarkList as user on user.id = uUpload.user_marklist_id where user.user_id="+userMarklistId;
      }
     return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
 
  UserMarklist_Upload.setAppIds = function(user_id, app_id){
    var query = "Update UserMarklist_Upload set app_id = '" + app_id + "' where app_id is null and user_id =" + user_id;// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  UserMarklist_Upload.deleteUserData = function(user_id){
    var query = "DELETE FROM UserMarklist_Upload WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }

  UserMarklist_Upload.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  UserMarklist_Upload.belongsTo(sequelize.models.userMarkList, {foreignKey: 'user_marklist_id'});
  UserMarklist_Upload.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});
  
  return UserMarklist_Upload;
};
