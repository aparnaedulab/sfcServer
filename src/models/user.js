"use strict";

const { STRING, INTEGER } = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  var User =  sequelize.define('User', {
    name: DataTypes.STRING(100),
    surname: DataTypes.STRING(100),
    fullname: DataTypes.STRING(100),
    marksheetName : DataTypes.STRING(100),
    email: DataTypes.STRING(100),
    password: DataTypes.STRING,
    mobile: DataTypes.STRING(17),
    gender: DataTypes.ENUM('Male', 'Female','Transgender'),
    otp: DataTypes.STRING(6),
    is_otp_verified: DataTypes.BOOLEAN(),
    email_verification_token: DataTypes.STRING(20),
    is_email_verified: DataTypes.BOOLEAN(),
    user_type: DataTypes.ENUM('admin', 'subAdmin', 'student', 'agent','superAdmin'),
    city  :  DataTypes.STRING(100),
    dob: DataTypes.DATEONLY, 
    mobile_country_code: DataTypes.STRING(5),
    postal_code: {
      type: DataTypes.STRING(16),
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    current_location:DataTypes.STRING(17),
    user_status: DataTypes.ENUM('active', 'inactive', 'deleted'),
    district: DataTypes.STRING(255),
    state: DataTypes.STRING(255),
    agent_id : DataTypes.INTEGER,
    nationality :DataTypes.STRING(30),
    category_input :DataTypes.STRING(30),
    sub_category :DataTypes.STRING(30),
    enrollmentNo : DataTypes.JSON,
    aadharNumber : DataTypes.STRING(30),
    edulab_rights: DataTypes.JSON,

  }, {

    sequelize,
    tableName: 'User',
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
        }
    ]
  });

  User.getAllStudents = function(agent_id,filters,limit,offset) {
    var where_student_name = '',
    where_application_email = '';
    var limitOffset = '';
    if (filters.length > 0) {
      filters.forEach(function(filter) {
          if (filter.name == "name") {
            where_student_name = filter.value;
          } else if (filter.name == "surname") {
            where_student_surname = " AND u.surname LIKE '%" + filter.value + "%' ";
          } else if (filter.name == "email") {
            where_application_email = " AND u.email like '%" + filter.value  + "%' ";
          }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
    var query = "SELECT CONCAT(u.name,' ',u.surname) as name,u.email,u.id as user_id,u.created_at, a.id as app_id";
    query += " FROM User AS u  LEFT JOIN Application AS a ON a.user_id = u.id ";
    query += " WHERE 1 = 1 AND u.agent_id = " + agent_id;
    query += where_application_email;
    query += where_student_name;
    query += " ORDER BY u.created_at desc ";
    query += limitOffset;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});    
  };

  User.getUserDetails = function(app_id) {
    var query = "SELECT u.id as user_id,u.name as studentName,u.surname as studentSurname,u.email as studentEMail,"
    query += " u.mobile_country_code as studentMobileCountryCode,u.mobile as studentMobile,"
    query += " a.marksheetName as agentName,a.email as agentEmail, app.tracker, ";
    query += " a.mobile_country_code as agentMobileCountryCode,a.mobile as agentMobile";
    query += " FROM User AS u JOIN Application AS app ON app.user_id = u.id ";
    query += " LEFT JOIN User AS a ON u.agent_id = a.id ";
    query += " WHERE app.id = " + app_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});    
  };
  
  User.getAllUsersInfo = function(filters,limit,offset,emailId) {
    // var filters ='';
    var whereDateValidation = '';
    var where_student_name = '',
      // where_student_surname = '',
      where_application_id = '',
      where_application_email = '',
      where_application_date = '';
    if(!emailId.includes('@edulab.in')){
      whereDateValidation =  " AND DATE(user.created_at) < '2023-12-23'";
    }
    var limitOffset = '';
    if (filters.length > 0) {
      filters.forEach(function(filter) {
          if (filter.name == "name") {
            where_student_name = filter.value;
          } else if (filter.name == "surname") {
            where_student_surname = " AND user.surname LIKE '%" + filter.value + "%' ";
          } else if (filter.name == "application_id") {
            where_application_id = " AND a.id = " + filter.value + " ";
          } else if (filter.name == "email") {
            where_application_email = " AND user.email like '%" + filter.value  + "%' ";
          } else if(filter.name == 'application_year'){
            where_application_date = filter.value;
          }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
    var query = "SELECT DISTINCT user.email,CONCAT (user.name,' ',user.surname) as name,user.id,user.user_type, user.created_at,user.user_status, "
    query+=' user.current_location FROM User user '
    query += " WHERE user.user_type = 'student'";
    query += where_application_id;
    query += where_application_email;
    query += where_student_name;
    query += where_application_date;
    query += whereDateValidation;
    query += " ORDER BY user.created_at desc ";
    query += limitOffset;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

User.getAllAgentInfo = function(filters,limit,offset) {
  var where_student_name = '',
    where_application_id = '',
    where_application_email = '';
  var limitOffset = '';
  if (filters.length > 0) {
    filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        }else if (filter.name == "email") {
          where_application_email = " AND user.email like '%" + filter.value  + "%' ";
        }
    });
  }
  if (limit != null && offset != null) {
    limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  var query = "SELECT DISTINCT user.email,user.marksheetName as name,user.id,user.user_type, user.created_at,user.user_status, "
  query+=' user.current_location FROM User user '
  query += " WHERE user.user_type = 'agent'";
  query += where_application_email;
  query += where_student_name;
  query += " ORDER BY user.created_at desc ";
  query += limitOffset;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};
  
  User.associate = (models) => {
    User.hasOne(models.Role, { foreignKey: 'userid' });
    User.hasOne(models.Super_Role, { foreignKey: 'userid' });
  };

  return User;
};