"use strict";

module.exports = function(sequelize, DataTypes) {
  var SY_User_Enrollment_Detail = sequelize.define("SY_User_Enrollment_Detail", {
    enrollment_no: DataTypes.STRING(30),
    application_date: DataTypes.DATEONLY,
    user_id : DataTypes.INTEGER(11),
    application_id : DataTypes.INTEGER(11),
    randomNumber : DataTypes.INTEGER(11),
    outward : DataTypes.STRING(255)
  }, {
    sequelize,
    tableName: 'SY_User_Enrollment_Detail',
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
  
  SY_User_Enrollment_Detail.getAlldata = function() {
    var query = 'Select * from SY_User_Enrollment_Detail';
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  SY_User_Enrollment_Detail.getListLastData = function() {
    var query='';
    query +=" SELECT id , enrollment_no From SY_User_Enrollment_Detail ";
    query +=" WHERE id=(SELECT MAX(id) FROM SY_User_Enrollment_Detail)";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  SY_User_Enrollment_Detail.getApplicationDetailsById = function(app_id){
    var query = "SELECT app.id, app.created_at as date, app.inward, vt.sealedCover, vt.noOfCopies,  ";
        query += " if(app.approved_by is not null,app.approved_by, 'N/A') as approved_by, if(app.verified_date is not null,  app.verified_date, '') as verified_date, ";
        query += " if(app.print_by is not null,app.print_by, 'N/A') as print_by, if(app.print_date is not null,app.print_date, 'N/A') as print_date,";
        query += " if(ued_sy.enrollment_no is not null,ued_sy.enrollment_no, 'N/A') as SY_enrollment_no, ";
        query += " if(ued_sy.randomNumber is not null,ued_sy.randomNumber, 'N/A') as SY_randomNumber,";
        query += " if(ued_sy.outward is not null,ued_sy.outward, 'N/A') as outward "
        query += " FROM Application AS app  ";
        query += " JOIN VerificationTypes as vt ON vt.app_id = app.id ";
        query += " LEFT JOIN SY_User_Enrollment_Detail AS ued_sy ON ued_sy.application_id = app.id "
        query += " WHERE app.id = " + app_id;
        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  },
  
  SY_User_Enrollment_Detail.getApplicationData = function(app_id){
    var query = " select max(sy.enrollment_no) as max_enroll,app.created_at as app_date from SY_User_Enrollment_Detail as sy, Application as app where app.id = " + app_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  
  return SY_User_Enrollment_Detail;
};
