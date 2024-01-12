"use strict";

module.exports = function(sequelize, DataTypes) {
  var User_Curriculum = sequelize.define("User_Curriculum", {
    name: DataTypes.TEXT,
  	file_name: DataTypes.TEXT,
    lock_transcript: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
    collegeId: DataTypes.INTEGER(11),
    emailStatus : DataTypes.STRING(20),
    emailMsgId : DataTypes.TEXT
  },{
    sequelize,
    tableName: 'User_Curriculum',
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

  User_Curriculum.updateEmailStatus = function(id,status){
    var query = "Update User_Curriculum set emailStatus = '" + status + "' where id = " + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  User_Curriculum.updateSingleCollegeEmailStatus = function(user_id,college_id, msgID,value){
    var query = "Update User_Curriculum set emailStatus = '" + value + "', emailMsgId='" + msgID +"' where user_id = " + user_id + " and collegeId = " + college_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  User_Curriculum.getCollegeName = function(user_id){
    var query = "SELECT DISTINCT college.id, college.name, college.emailId, college.contactPerson, college.contactNo, college.alternateContactPerson, college.alternateContactNo, college.alternateEmailId, curriculum.emailStatus as collegeEmailStatus, curriculum.app_id FROM User_Curriculum AS curriculum ";
    query += " JOIN College AS college ON college.id = curriculum.collegeId ";
    query += " WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  },

  User_Curriculum.getDistinctCollege = function(user_id) {
    var query = "SELECT DISTINCT collegeId FROM User_Transcript WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  
  User_Curriculum.setAppIds = function(user_id, app_id){
    var query = "Update User_Curriculum set app_id = '" + app_id + "' where app_id is null and  user_id =" + user_id;// WHERE created_at between '" + condition + "'";
   return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  User_Curriculum.deleteUserData = function(user_id){
    var query = "DELETE FROM User_Curriculum WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }

  
  User_Curriculum.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  User_Curriculum.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});
  
  return User_Curriculum;
};
