"use strict";

module.exports = function(sequelize, DataTypes) {
  var MDT_User_Enrollment_Detail = sequelize.define("MDT_User_Enrollment_Detail", {
    enrollment_no: DataTypes.STRING(30),
    application_date: DataTypes.DATEONLY,
    user_id : DataTypes.INTEGER(11),
    application_id : DataTypes.INTEGER(11),
    randomNumber : DataTypes.STRING(11),
    outward : DataTypes.STRING(255),
    inward : DataTypes.STRING(255),
    MDT_type: DataTypes.STRING(255),
  }, {
    sequelize,
    tableName: 'MDT_User_Enrollment_Detail',
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
  
  MDT_User_Enrollment_Detail.getAlldata = function() {
    var query = 'Select * from MDT_User_Enrollment_Detail';
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  MDT_User_Enrollment_Detail.getListLastData = function() {
    var query='';
    query +=" SELECT id , enrollment_no From MDT_User_Enrollment_Detail ";
    query +=" WHERE id=(SELECT MAX(id) FROM MDT_User_Enrollment_Detail)";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };
  
  MDT_User_Enrollment_Detail.getApplicationDetailsById = function(app_id){
    var query = "SELECT app.id, app.created_at as date, app.inward, vt.sealedCover, vt.noOfCopies, ";
    query += " if(app.approved_by is not null,app.approved_by, 'N/A') as approved_by, if(app.verified_date is not null,  app.verified_date, '') as verified_date, ";
    query += " if(app.print_by is not null,app.print_by, 'N/A') as print_by, if(app.print_date is not null,app.print_date, 'N/A') as print_date,";
    query += " if(ued_mark.enrollment_no is not null,ued_mark.enrollment_no, 'N/A') as MDT_enrollment_no , ";
    query += " if(ued_mark.randomNumber is not null,ued_mark.randomNumber, 'N/A') as MDT_randomNumber, ";
    query += " CONCAT(CASE WHEN( vt.marksheet = true) THEN CONCAT( 'Marksheet - ',ued_mark.outward , ',')ELSE '' END,";
    query += " CASE WHEN( vt.transcript = true) THEN CONCAT('Transcript - ', ued_tran.outward , ',')ELSE '' END,";
    query += " CASE WHEN( vt.degreeCertificate = true) THEN CONCAT('Degree Certificate - ', ued_degree.outward)ELSE '' END) AS outward "
    query += " FROM Application AS app LEFT JOIN MDT_User_Enrollment_Detail AS ued_mark ON ued_mark.application_id = app.id and ued_mark.MDT_type = 'marksheet'";
    query += " LEFT JOIN MDT_User_Enrollment_Detail AS ued_tran ON ued_tran.application_id = app.id and ued_tran.MDT_type = 'transcript'";
    query += " LEFT JOIN MDT_User_Enrollment_Detail AS ued_degree ON ued_degree.application_id = app.id and ued_degree.MDT_type = 'degree'";
    query += " JOIN VerificationTypes as vt ON vt.app_id = app.id ";
    query += " WHERE app.id = " + app_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  },
  MDT_User_Enrollment_Detail.getApplicationData = function(app_id){
    var query = " select max(mdt.enrollment_no) as max_enroll,app.created_at as app_date from MDT_User_Enrollment_Detail as mdt, Application as app where app.id = " + app_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  return MDT_User_Enrollment_Detail;
};
