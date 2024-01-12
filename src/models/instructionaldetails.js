
"use strict"

module.exports = function(sequelize, DataTypes) {
var InstructionalDetails = sequelize.define("InstructionalDetails", {
    userId: DataTypes.INTEGER,
    studentName: DataTypes.STRING(255),
    courseName: DataTypes.STRING(255),
    collegeName : DataTypes.STRING(255),
    emailStatus : DataTypes.STRING(20),
    duration: DataTypes.STRING(10),
    division: DataTypes.STRING(255),
    yearofpassing: DataTypes.STRING(255),
    specialization: DataTypes.STRING(255),
    emailMsgId : DataTypes.TEXT,
    instruction_medium : DataTypes.STRING(30),
    instruction_medium_two:DataTypes.STRING(30),
    academicYear : DataTypes.STRING(20),
    reference_no : DataTypes.INTEGER(11),
    education : DataTypes.STRING(255),
    yearofenrollment: DataTypes.STRING(255),
    clg: DataTypes.STRING(255),
    courseshort: DataTypes.STRING(255),
    Course_part :DataTypes.STRING(255),
    seat_no:DataTypes.STRING(6),
    internship:DataTypes.STRING(30),
    new_course_faculty:DataTypes.STRING(30),
    diff_col_one:DataTypes.JSON,
		diff_col_two:DataTypes.JSON,
    year_attend_one :DataTypes.JSON,
		year_attend_two:DataTypes.JSON,
    student_college_type : DataTypes.STRING(20),
    selected_pattern:DataTypes.JSON,
    selected_exam:{
      type:DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
        lock_transcript: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
    verify_doc: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
 }, {
  sequelize,
  tableName: 'InstructionalDetails',
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

 InstructionalDetails.updateEmailStatus = function(id,status){
    var query = "Update InstructionalDetails set emailStatus = '" + status + "' where id = " + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  InstructionalDetails.updateSingleEmailStatus = function(user_id,msgID,value){
    var query = "Update InstructionalDetails set emailStatus = '" + value + "', emailMsgId='" + msgID +"' where userId = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  InstructionalDetails.getMaxRefetenceNumber = function(){
    var query = "SELECT MAX(reference_no) as maxNumber FROM InstructionalDetails";// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

  },

  InstructionalDetails.updateReferenceNumber = function(user_id,reference_no){
    var query = "Update InstructionalDetails set reference_no = " + reference_no + " where userId =" + user_id;// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  InstructionalDetails.updateReferenceNumber_new = function(id,reference_no){
    var query = "Update InstructionalDetails set reference_no = " + reference_no + " where id in (" + id + ")";// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  },

  InstructionalDetails.getCollegeName = function(user_id){
    var query = "SELECT DISTINCT college.id, college.name, college.emailId, college.contactPerson, college.contactNo, college.alternateContactPerson, college.alternateContactNo, college.alternateEmailId, inst.emailStatus as collegeEmailStatus, transcript.app_id FROM userMarkList AS transcript ";
    query += " JOIN InstructionalDetails AS inst ON inst.userId = transcript.user_id ";
    query += " JOIN College AS college ON college.id = transcript.collegeId ";
    query += " WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  InstructionalDetails.setAppIds = function(user_id, app_id){
    var query = "Update InstructionalDetails set app_id = '" + app_id + "' where app_id is null and userId =" + user_id;// WHERE created_at between '" + condition + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  InstructionalDetails.deleteUserData = function(user_id){
    var query = "DELETE FROM InstructionalDetails WHERE userId = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }
  
  InstructionalDetails.getInstructionalDetails = function(condition){
    var query = "SELECT mrk.* FROM InstructionalDetails AS mrk   WHERE " + condition + ' AND mrk.app_id is not null'; 
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  
  InstructionalDetails.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});

 return InstructionalDetails;
};