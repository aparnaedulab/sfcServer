"use strict";

module.exports = function(sequelize, DataTypes) {
  var UserEnrollmentDetail = sequelize.define("User_Enrollment_Detail", {
    enrollment_no: DataTypes.STRING(30),
    application_date: DataTypes.DATEONLY,
    user_id : DataTypes.INTEGER(11),
    application_id : DataTypes.INTEGER(11),
    random_string : DataTypes.STRING(30)
  },{
    sequelize,
    tableName: 'User_Enrollment_Detail',
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
  
  UserEnrollmentDetail.getAlldata = function() {
    var query = 'Select * from User_Enrollment_Detail';
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  UserEnrollmentDetail.getListLastData = function() {
    var query='';
    query +=" SELECT id , enrollment_no From User_Enrollment_Detail ";
    query +=" WHERE id=(SELECT MAX(id) FROM User_Enrollment_Detail)";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  UserEnrollmentDetail.getApplicationDetailsById = function(app_id){
        var query = "SELECT app.id, app.created_at as date, app.inward, if(app.outward is not null,app.outward, 'N/A') AS outward,";
        query += " if(app.approved_by is not null,app.approved_by, 'N/A') as approved_by, if(app.verified_date is not null, app.verified_date, '') as verified_date, ";
        query += " if(app.print_by is not null,app.print_by, 'N/A') as print_by, if(app.print_date is not null,app.print_date, 'N/A') as print_date,";
        query += " if(ued.enrollment_no is not null,ued.enrollment_no, 'N/A') as enrollment_no , ";
        query += " if(ued.random_string is not null,ued.random_string, 'N/A') as random_string ";
        query += " FROM Application AS app JOIN User_Enrollment_Detail AS ued ON ued.application_id = app.id ";
        query += " WHERE app.id = " + app_id;
        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
      }
  
  return UserEnrollmentDetail;
};
