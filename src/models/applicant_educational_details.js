"use strict";

module.exports = function(sequelize, DataTypes) {
  var Applicant_Educational_Details = sequelize.define("Applicant_Educational_Details", {
    CollegeName:DataTypes.STRING(255),
    CollegeAddress:DataTypes.STRING(255),
    CourseName:DataTypes.STRING(255),
    CollegeYear:DataTypes.STRING(255),
    Semester:DataTypes.STRING(50),
    Month:DataTypes.STRING(50),
    Year :DataTypes.STRING(50),
    OverAllGrade :DataTypes.STRING(10),
    rollNo:DataTypes.STRING(255),
    user_id: DataTypes.STRING(30),
    medium_instruction : DataTypes.STRING(20),
    PartName : DataTypes.STRING(50),
    otherUniversity : DataTypes.STRING(50),
    otherCollege : DataTypes.STRING(150),
    otherCourse : DataTypes.STRING(50),
    pattern : DataTypes.STRING(10),
    result : DataTypes.STRING(25), 
    stillStudying : DataTypes.STRING(10),
    duration : DataTypes.STRING(10),
    course_type : DataTypes.ENUM('Regular','External','Special'),
    app_id : DataTypes.STRING(15),
    prn_no : DataTypes.STRING(15)
  }, {

    sequelize,
    tableName: 'Applicant_Educational_Details',
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

  Applicant_Educational_Details.getCourseName = function(user_id) {
    var query = "SELECT aed.CourseName as Course_full_name, aed.CollegeName, aed.Semester, aed.Year from Applicant_Educational_Details as aed ";
    // query += " Left Join Course as cour on cour.CourseShortForm = aed.CourseName "; , cour.CourseName as Course_full_name, cour.CourseShortForm, 
    //query += " Left Join Course as cour on cour.CourseName = aed.CourseName ";
    query += " WHERE aed.user_id ="+ user_id ;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Applicant_Educational_Details.coursewisestats = function(user_id) {
    var query = "SELECT GROUP_CONCAT(DISTINCT(c.CourseName)) as CourseName from Application as app ";
    query += " LEFT JOIN Applicant_Educational_Details as aed on aed.user_id = app.user_id ";
    query += " LEFT JOIN Course as c on c.CourseShortForm = aed.courseName ";
    query += " GROUP BY c.CourseShortForm, aed.user_id ";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Applicant_Educational_Details.getCheckDuplicate = function(name,fathername,surname,CollegeName,CourseName){
    var query = "Select u.id from User as u Join Applicant_Educational_Details as aed on aed.user_id = u.id ";
    query += "Left Join Application as app on app.user_id = u.id ";
    query += " where u.name = '"+name+"' and u.fathername = '"+fathername+"' and u.surname = '"+surname+"' and aed.CollegeName = '"+CollegeName+"' and aed.CourseName = '"+CourseName+"'";
   return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  return Applicant_Educational_Details;
};


