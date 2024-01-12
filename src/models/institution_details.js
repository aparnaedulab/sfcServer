"use strict";

module.exports = function(sequelize, DataTypes) {
  var Institution_details = sequelize.define("Institution_details", {
    university_name: DataTypes.STRING(100),
    email: DataTypes.STRING(100),
    contact_number: DataTypes.STRING(17),
    country_name : DataTypes.TEXT,
    contact_person : DataTypes.STRING(100),
    type  : DataTypes.STRING(100),
		landmark : DataTypes.TEXT,
    pincode : DataTypes.STRING(20),
    wesno : DataTypes.STRING(20),
    cesno:DataTypes.STRING(20),
    iqasno:DataTypes.STRING(20),
    eduPerno:DataTypes.STRING(20),
    icasno:DataTypes.STRING(20),
    wesupload:DataTypes.STRING(20),
    studyrefno:DataTypes.STRING(255),
    emprefno:DataTypes.STRING(255),
    visarefno : DataTypes.STRING(255),
    visaaccno:DataTypes.STRING(255),
    empaccno :DataTypes.STRING(255),
    studyaccno : DataTypes.STRING(255),
    otheraccno:DataTypes.STRING(255),
    myieeno:DataTypes.STRING(255),
    icesno:DataTypes.STRING(255),
    nasbano :DataTypes.STRING(255),
    wesrecord:DataTypes.STRING(255),
    OtherEmail : DataTypes.TEXT,
    nceesno : DataTypes.STRING(255),
    naricno : DataTypes.STRING(255),
    emailAsWes : DataTypes.STRING(255),
    ncano : DataTypes.STRING(255),
    caprno:DataTypes.STRING(255),
    ndebno:DataTypes.STRING(255),
    ecerefno: DataTypes.STRING(50),
    nameaswes :DataTypes.STRING(255),
    lastnameaswes:DataTypes.STRING(255),
    hrdno:DataTypes.STRING(255),
    inst_address : DataTypes.STRING(255),
    deliveryType : DataTypes.STRING(50),
    deliverySpeed : DataTypes.STRING(50),
    noofcopies: {
      type: DataTypes.INTEGER
    },
    address : DataTypes.STRING(255),
    source:  DataTypes.STRING(30),
    dembassyno: DataTypes.STRING(50)
  },{

		sequelize,
		tableName: 'Institution_details',
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

  Institution_details.getAllInstitutionType = function(id){
    var query = "select email,type,wesno,cesno,iqasno,eduPerno,icasno,wesupload,studyrefno,emprefno,";
    query += "visarefno,visaaccno,empaccno,studyaccno,otheraccno,myieeno,icesno,nasbano,OtherEmail,nceesno,hrdno,";
    query += "naricno,ncano from Institution_details where app_id =" + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  
  }

  Institution_details.getAllInstitutionType_signed = function(id){
    var query = "select email,type,wesno,cesno,iqasno,eduPerno,icasno,wesupload,studyrefno,emprefno,";
    query += "visarefno,visaaccno,empaccno,studyaccno,otheraccno,myieeno,icesno,nasbano,OtherEmail,nceesno,hrdno,";
    query += "naricno,ncano from Institution_details where deliveryType = 'digital' and app_id =" + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  
  }

  Institution_details.getAllInstitutionType_print = function(id){
    var query = "select email,type,wesno,cesno,iqasno,eduPerno,icasno,wesupload,studyrefno,emprefno,";
    query += "visarefno,visaaccno,empaccno,studyaccno,otheraccno,myieeno,icesno,nasbano,OtherEmail,nceesno,hrdno,";
    query += "naricno,ncano from Institution_details where deliveryType = 'physcial' and app_id =" + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  
  }

  Institution_details.getWesStudents = function(filters,limit,offset) {
    var where_student_name = '',
      where_application_id = '',
      where_application_email = '',
      where_application_wesno = '',
      where_application_date = '';
    var limitOffset = '';
    if (filters.length > 0) {
      filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        } else if (filter.name == "surname") {
          where_student_surname = " AND u.surname LIKE '%" + filter.value + "%' ";
        } else if (filter.name == "application_id") {
          where_application_id = " AND i.app_id = " + filter.value + " ";
        } else if (filter.name == "email") {
          where_application_email = " AND u.email like '%" + filter.value  + "%' ";
        } else if (filter.name == "wesno") {
          where_application_wesno = " AND i.wesno like '%" + filter.value  + "%' ";
        }else if(filter.name == 'application_year'){
          where_application_date = filter.value
        }
      }); 
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
    var query ="select  concat(u.name,' ',u.surname) as name ,u.email, i.app_id , i.type, i.wesno ,i.user_id, i.wesupload , ";
    query +=" i.updated_at,u.current_location from Institution_details as i ";
    query +=" join User as u on i.user_id = u.id ";
    query +=" where i.type = 'Educational credential evaluators WES' and i.wesupload is not null";
    query += where_application_id;
    query += where_application_email;
    query += where_application_wesno;
    query += where_student_name;
    query += where_application_date;
    query += " order by updated_at desc";
    query += limitOffset;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  Institution_details.getInvalidWesStudents = function(user_id){
    var query = "select  concat(u.name,' ',u.surname) as name ,u.email, i.app_id , i.type, i.wesno ,i.user_id,i.updated_at,i.wesrecord from Institution_details as i join User as u on i.user_id = u.id where i.wesrecord='Not found' and  i.type = 'Educational credential evaluators WES'and i.wesupload is null order by updated_at desc;" 
     return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  

  Institution_details.getWESApplications = function(date){
    var query = "select id, type,wesno,wesupload,app_id,user_id from Institution_details where type = 'Educational credential evaluators WES' and wesupload = '" + date +"' and wesno is not null and app_id is not null";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Institution_details.getInstituteData = function(app_id){
    var query = "select * from Institution_details where user_id = " + app_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  Institution_details.getInstituteDataone = function(id){
    var query = "select * from Institution_details where id = " + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  },

  Institution_details.deleteUserData = function(user_id){
    var query = "DELETE FROM Institution_details WHERE user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.DELETE});
  }

  Institution_details.getDeliveryTypeModeWiseAppCount = function(source_from,type,mode){
    var query = "SELECT count( DISTINCT(app.id) ) AS app_count from Application as app";
    query += " JOIN User AS usr  ON app.user_id = usr.id";
    query += " JOIN Institution_details AS inst ON inst.user_id = usr.id "
    query += " WHERE app.source_from = '" + source_from + "' AND inst.deliveryType = '" + type + "' ";
    query += " AND inst.deliverySpeed = '" + mode + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }


  Institution_details.belongsTo(sequelize.models.Application, {foreignKey: 'app_id'});
  Institution_details.associate = (models) => {
    Institution_details.belongsTo(models.User, {foreignKey: 'user_id'});
  };

  

return Institution_details;
};