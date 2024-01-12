"use strict";


module.exports = function(sequelize, DataTypes) {
  var User_Course_Enrollment_Detail_Attestation = sequelize.define("User_Course_Enrollment_Detail_Attestation", {
    enrollment_no: DataTypes.STRING(30),
    application_date: DataTypes.DATEONLY,
    application_id: {
      type: DataTypes.INTEGER,
  },
  user_id:{
    type: DataTypes.INTEGER,
  },
   outward : DataTypes.STRING(100),
   type : DataTypes.STRING(100),
   degree_type : DataTypes.STRING(100),
   university : DataTypes.STRING(100)
  },{

    sequelize,
    tableName: 'User_Course_Enrollment_Detail_Attestation',
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
  // },
  // {
  //   classMethods: {
    User_Course_Enrollment_Detail_Attestation.assigndata = function(user_id){
          var query='';
            query += " Select * from User_Course_Enrollment_Detail WHERE user_id="+user_id;
            query += " AND college_name!='null'";
 
            return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

          };
          User_Course_Enrollment_Detail_Attestation.getAlldata = function() {
        var query = 'Select * from User_Course_Enrollment_Detail';
        // 
        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
        };
        User_Course_Enrollment_Detail_Attestation.getListLastData = function() {
          var query='';
          // var query = "SELECT DISTINCT TRIM(name) AS name, TRIM(LOWER(REPLACE(REPLACE(name,' ',''), '\t', ''))) as lowCourse FROM College_Course WHERE status='active' GROUP BY lowCourse ORDER BY REPLACE(lowCourse,'(','') asc";
          query +=" SELECT id , enrollment_no From User_Course_Enrollment_Detail_Attestation ";
          query +=" WHERE id=(SELECT MAX(id) FROM User_Course_Enrollment_Detail_Attestation)";
 
          // 
          return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
        };
  //       }
  // });

  User_Course_Enrollment_Detail_Attestation.getApplicationDetailsById = function(app_id,source){
    if(source == 'attestation'){
      var query = "SELECT app.id, app.created_at as date, app.inward, ";
      query += " if(app.approved_by is not null,app.approved_by, 'N/A') as approved_by, if(app.verified_date is not null,  app.verified_date, '') as verified_date, ";
      query += " if(app.print_by is not null,app.print_by, 'N/A') as print_by, if(app.print_date is not null,app.print_date, 'N/A') as print_date,";
      query += " if(ued_mark.enrollment_no IS NOT NULL, ued_mark.enrollment_no, 'N/A') as enrollment_no , ";
      query += " if(ued_mark.barcode IS NOT NULL, ued_mark.barcode, 'N/A') as barcode, ";
      query += " CONCAT(CASE WHEN( app_det.attestedfor like '%marksheet%') THEN CONCAT( 'Marksheet - ',ued_mark.outward , ',')ELSE '' END,";
      query += " CASE WHEN( app_det.attestedfor like '%transcript%') THEN CONCAT('Transcript - ', ued_tran.outward , ',')ELSE '' END,";
      query += " CASE WHEN( app_det.attestedfor like '%degree%') THEN CONCAT('Degree Certificate - ', ued_degree.outward)ELSE '' END) AS outward"
      query += " FROM Application AS app LEFT JOIN User_Course_Enrollment_Detail_Attestation AS ued_mark ON ued_mark.application_id = app.id and ued_mark.type ='marksheets'";
      query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS ued_tran ON ued_tran.application_id = app.id and ued_tran.type ='transcript'";
      query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS ued_degree ON ued_degree.application_id = app.id and ued_degree.type='degree'";
      query += " LEFT JOIN Applied_For_Details AS app_det ON app_det.app_id = app.id ";
      query += " WHERE app.id = " + app_id;
    }else if(source == 'moi'){
      var query = "SELECT app.id, app.created_at as date, app.inward,";
      query += " if(app.approved_by is not null,app.approved_by, 'N/A') as approved_by, if(app.verified_date is not null,  app.verified_date, '') as verified_date, ";
      query += " if(app.print_by is not null,app.print_by, 'N/A') as print_by, if(app.print_date is not null,app.print_date, 'N/A') as print_date,";
      query += " if(ued_mark.enrollment_no IS NOT NULL, ued_mark.enrollment_no, 'N/A') as enrollment_no , ";
      query += " if(ued_mark.barcode IS NOT NULL, ued_mark.barcode, 'N/A') as barcode, ";
      query += " ued_mark.outward AS outward "
      query += " FROM Application AS app LEFT JOIN User_Course_Enrollment_Detail_Attestation AS ued_mark ON ued_mark.application_id = app.id and ued_mark.type = 'instructional'";
      query += " WHERE app.id = " + app_id;
    }
    
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  // User_Course_Enrollment_Detail_Attestation.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  // User_Course_Enrollment_Detail_Attestation.belongsTo(sequelize.models.Application, {foreignKey: 'application_id'});
  
  return User_Course_Enrollment_Detail_Attestation;
};
