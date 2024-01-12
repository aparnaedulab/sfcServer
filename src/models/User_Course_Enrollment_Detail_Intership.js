"use strict";

module.exports = function(sequelize, DataTypes) {
  var User_Course_Enrollment_Detail_Intership = sequelize.define("User_Course_Enrollment_Detail_Intership", {
    enrollment_no: DataTypes.STRING(30),
    application_date: DataTypes.DATEONLY,
    application_id: {
      type: DataTypes.INTEGER,
  },
  user_id:{
    type: DataTypes.INTEGER,
  },
   barcode: DataTypes.STRING(30),

  },{

    sequelize,
    tableName: 'User_Course_Enrollment_Detail_Intership',
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
    User_Course_Enrollment_Detail_Intership.assigndata = function(user_id){
          var query='';
            query += " Select * from User_Course_Enrollment_Detail WHERE user_id="+user_id;
            query += " AND college_name!='null'";
 
            return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});

          };
          User_Course_Enrollment_Detail_Intership.getAlldata = function() {
        var query = 'Select * from User_Course_Enrollment_Detail';
        // 
        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
        };
        User_Course_Enrollment_Detail_Intership.getListLastData = function() {
          var query='';
          // var query = "SELECT DISTINCT TRIM(name) AS name, TRIM(LOWER(REPLACE(REPLACE(name,' ',''), '\t', ''))) as lowCourse FROM College_Course WHERE status='active' GROUP BY lowCourse ORDER BY REPLACE(lowCourse,'(','') asc";
          query +=" SELECT id , enrollment_no From User_Course_Enrollment_Detail_Intership ";
          query +=" WHERE id=(SELECT MAX(id) FROM User_Course_Enrollment_Detail_Intership)";
 
          // 
          return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
        };
        User_Course_Enrollment_Detail_Intership.getApplicationDetailsById = function(app_id){
            var query = "SELECT app.id, app.created_at as date, app.inward, if(app.outward is not null,app.outward, 'N/A') AS outward,";
            query += " if(app.approved_by is not null,app.approved_by, 'N/A') as approved_by, if(app.verified_date is not null, app.verified_date, '') as verified_date, ";
            query += " if(app.print_by is not null,app.print_by, 'N/A') as print_by, if(app.print_date is not null,app.print_date, 'N/A') as print_date,";
            query += " if(ued.enrollment_no is not null,ued.enrollment_no, 'N/A') as enrollment_no , ";
            query += " if(ued.barcode is not null,ued.barcode, 'N/A') as barcode ";
            query += " FROM Application AS app JOIN User_Course_Enrollment_Detail_Intership AS ued ON ued.application_id = app.id ";
            query += " WHERE app.id = " + app_id;
            return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
          }
  //       }
  // });

  // User_Course_Enrollment_Detail_PDC.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  // User_Course_Enrollment_Detail_PDC.belongsTo(sequelize.models.Application, {foreignKey: 'application_id'});
  
  return User_Course_Enrollment_Detail_Intership;
};
