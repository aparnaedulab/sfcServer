"use strict";
module.exports = function(sequelize, DataTypes) {
    var Program_List = sequelize.define("Program_List", {
        college_code : DataTypes.STRING(20),
        college_name : DataTypes.STRING(500),
        college_address : DataTypes.STRING(500),
        course_code : DataTypes.STRING(20),
        programme_pattern : DataTypes.STRING(250),
        part_name : DataTypes.STRING(100),
        term_name : DataTypes.STRING(100),
        year: DataTypes.STRING(20),
        course_short_form: DataTypes.STRING(255),
        college_short_form: DataTypes.STRING(500),
        college_status  : DataTypes.ENUM('active', 'inactive'),
        course_status  : DataTypes.ENUM('active', 'inactive'),
        emailId: DataTypes.STRING(100),
        contactNo: DataTypes.STRING(30),
        contactPerson : DataTypes.STRING(100),
        alternateContactPerson : DataTypes.STRING(100),
        alternateContactNo : DataTypes.STRING(30),
        alternateEmailId : DataTypes.STRING(100),
        course_name : DataTypes.STRING(500),
        duration :DataTypes.STRING(500),
		degree_type : DataTypes.STRING(50),
        faculty : DataTypes.STRING(50),
		new_course_faculty : DataTypes.STRING(50),
        internship : DataTypes.BOOLEAN
    },{
        sequelize,
        tableName: 'Program_List',
        timestamps: true,
        createdAt:"created_at",
        updatedAt:"updated_at",
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
    Program_List.getCourseforSearch= function() {
        var query = 'SELECT DISTINCT course_name FROM Program_List';
        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
    };
    Program_List.getcollege= function() {
        var query = 'SELECT DISTINCT college_name FROM Program_List';
        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
    };
    Program_List.getCollegeName = function(){
        var query = "select DISTINCT college_name , college_address, college_short_form, college_status, college_code from Program_List ";
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getalldata = function(){
        var query = "select * from Program_List ";
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getCollegeCourseData = function(college_name){
        var query = 'select * from Program_List where college_name Like "%'+college_name+'%" And programme_pattern IS not Null';
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.activeInactiveCollege = function(college_name, college_status){
        var query = 'Update Program_List set college_status = '+'"'+college_status+'"'+' where college_name= "'+college_name+'"';
        return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
    };
    Program_List.updateCollege = function(college_name, college_code, college_Address, college_short_form){
        var query = 'Update Program_List set college_name = "'+college_name+'", college_code = "'+ college_code +'" , college_Address = "'+ college_Address +'" , college_short_form = "'+ college_short_form +'" where college_name = "'+ college_name +'"';
        //var query = "Update Program_List set college_name = '" + college_name + "', college_code = '" + college_code + "', college_Address = '" + college_Address + "' where college_name = '" + college_name +"'";
        return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
    };
    Program_List.updateAllCourse = function(college_name, course_code, emailId, contactNo, contactPerson, alternateEmailId, alternateContactPerson, alternateContactNo, replacestring){
        var query = 'Update Program_List set emailId = "' + emailId + '" , contactNo = "'+ contactNo +'" , contactPerson = "'+ contactPerson +'", alternateEmailId = "'+ alternateEmailId +'", alternateContactPerson = "'+ alternateContactPerson + '", alternateContactNo ="'+ alternateContactNo + '" where college_name = "'+college_name+'" and course_code = "'+course_code+'" and course_code IS not null';
        return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
    };
    Program_List.getCourseList = function(college_name){
        var query = 'select DISTINCT course_name from Program_List where college_name Like "%'+college_name+'%" ';
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getPatterndata = function(college_name,course){
        var query = 'select term_name, year from Program_List where college_name Like "%'+college_name+'%" and course_name like "%'+course+'%"';
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getCollegeNameAdmin = function(){
        var query = "select DISTINCT college_name , college_address, college_status, college_code from Program_List ";
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };
    Program_List.getCollegeEmailList = function(){
        var query = "SELECT DISTINCT emailId,alternateEmailId FROM Program_List where alternateEmailId is not null and emailId is not null";
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    };

	Program_List.getalldata = function(){
		var query = "select * from Program_List ";
		return sequelize.query(query, {
			type: sequelize.QueryTypes.SELECT
		});
	};
 
    Program_List.updatecourse = function(course_name,degree_type,duration,id,faculty,college_short_form){
        var query = 'Update Program_List set course_name = "'+course_name+'", degree_type = "'+ degree_type  +'",duration = "'+ duration +'",faculty = "'+ faculty +'",college_short_form = "'+ college_short_form+'",new_course_faculty = "'+ faculty  +'"  where id = "'+ id +'"';
        return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
    };
    return Program_List;
};