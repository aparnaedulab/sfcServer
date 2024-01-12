const Sequelize = require('sequelize');
var moment = require('moment');

module.exports = function (sequelize, DataTypes) {
    var Application =  sequelize.define('Application', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    tracker: {
            type: DataTypes.ENUM('preapply','apply','verification','verified','done','signed','print','printedulab'),
      allowNull: false
    },
    status: {
            type: DataTypes.ENUM('new','accept', 'reject','repeat','requested','changed'),
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
        user_id_byAgent :{
      type: DataTypes.INTEGER,
    },
        approved_by:{
      type: DataTypes.STRING(100),
    },
        print_date:{
      type: DataTypes.DATE,
    },
        courier_date:{
      type: DataTypes.DATE,
    },
        courier_name :{
      type: DataTypes.STRING(100),
    },
        tracking_id :{
      type: DataTypes.STRING(100),
    },
        app_status :{
          type: DataTypes.ENUM('new','repeat'),
          defaultValue : 'new'
    },
        print_by :{
      type: DataTypes.STRING(100),
    },
    // signed_by :{
    //   type: DataTypes.STRING(100),
    // },
        source_from :{
      type: DataTypes.STRING(100),
    },
        university :{
      type: DataTypes.STRING(100),
    },
        pick_up_date :{
      type: DataTypes.STRING(100),
    },
        signed_date :{
      type: DataTypes.STRING(100),
    },
        deliveryType :{
      type: DataTypes.STRING(100),
    },
        deliveryTime :{
      type: DataTypes.STRING(100),
    },
    notes: {
      type: DataTypes.TEXT,
    },
        print_signedstatus :{
      type: DataTypes.STRING(100),
    },
        verified_date:{
      type: DataTypes.DATE,
    },
        Pickupdate:{
      type: DataTypes.DATE,
    },
        senttoPrint:{
      type: DataTypes.DATE,
    },
    verifyprint: {
      type: DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: 0
    },
    inward: DataTypes.STRING(100),
    outward: DataTypes.STRING(100),
        rackNo : DataTypes.STRING(100),
        rowNo : DataTypes.STRING(100),
    verified_by: DataTypes.STRING(255),
    wes_error: DataTypes.STRING(255),
    collector_name: DataTypes.STRING(255),
    file_name: DataTypes.TEXT,
  }, {

    sequelize,
    tableName: 'Application',
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
  
  Application.getApplicationByUser = function (filters, tracker, status, limit, offset, userRole, universityRole, attest, verify,emailId) {
    var whereDateValidation = '';
    var where_student_name = '',
      where_application_id = '',
      where_application_email = '',
      where_source_from = '',
      where_tracker = '',
      where_status = '',
      where_super_roles = '',
      where_superuniversity_roles = '',
      where_order_id = '',
      where_portal_wise_condition = '';
      where_date='';

    var where_attest = '',
      where_convo = '',
      where_pdc = '',
      where_migration = '',
      where_verify = '',
      where_syverify = '';
    var limitOffset = '';
 
    if (filters.length > 0) {
      filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        }  else if (filter.name == "application_id") {
          where_application_id = " AND app.id = " + filter.value + " ";
        } else if (filter.name == "email") {
          where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
        } else if(filter.name == 'source_from'){
          where_source_from = " AND app.source_from = '" + filter.value + "' ";
        } else if(filter.name == "order_id"){
          where_order_id = " AND o.id = " + filter.value + " ";
        }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
  if(tracker != null){
    if(tracker == 'signed'){
        where_tracker = " AND (app.tracker = '" + tracker + "' or app.tracker = 'print_signed') and  (app.print_signedstatus = 'print' or app.print_signedstatus = 'print_signed') ";
      }
    else if(tracker == 'print'){
        where_tracker = " AND (app.tracker = '" + tracker + "' or app.tracker = 'print_signed') and  (app.print_signedstatus = 'signed  ' or app.print_signedstatus = 'print_signed') ";
      }

    else{
        where_tracker = " AND app.tracker = '" + tracker + "'";
      }

    }
  if(tracker =='signed' && status != null){
      where_status = " AND app.status in  ('accept', 'printreject')";
  }else if(status != null){
      where_status = " AND app.status = '" + status + "'";
    }

  if(tracker =='apply' ){
      where_date = "app.created_at";

  }else if(tracker =='verified'){
      where_date = "app.verified_date";

  }else if(tracker =='signed'|| tracker =='print'){
    where_date= "app.print_date";
  }else if(tracker =='done'){
    where_date= "app.courier_date";
  }else if(tracker =='printedulab'){
    where_date= "app.print_date";
  }else {
      where_date = "app.created_at";
    }

  if(userRole != null){
      where_super_roles = " AND app.source_from in " + userRole + " ";
    }

    console.log('universityRoleuniversityRole' , universityRole)
    if(universityRole != null){
      where_superuniversity_roles = " AND app.university in " + universityRole + " ";
    }
    console.log('where_superuniversity_roles' , where_superuniversity_roles)
  if(userRole.includes('guattestation')){
    where_attest = attest ;
    }

  if(userRole.includes('guconvocation')){
      where_convo = ' OR (ed.app_id is not null) '; // Condition not written as portal is not working
    }

  if(userRole.includes('gumigration')){
      where_migration = ' OR (aed.app_id is not null) ';
    }

  if(userRole.includes('pdc') || userRole.includes('guinternship')){
      where_pdc = ' OR (ed.app_id is not null)  ';
    }

  if(userRole.includes('guverification')){
      where_verify = verify;
    }

  if(userRole.includes('gusyverification')){
      where_syverify = ' OR (vt.secondYear = 1) ';
    }

  if(userRole.includes())

  if(attest && verify){
    where_portal_wise_condition = ' AND ( '+ where_attest + where_convo + where_migration + where_pdc + where_verify + where_syverify+ ' )'
      }
      // if(tracker ==null && status == null && filters.length == 0){
      //   where_super_roles = " AND app.source_from in ('gumoi') "
      //     } 
          console.log('where_tracker' , where_tracker)
          console.log('where_status' , where_status)
          console.log('where_application_id' , where_application_id)
          console.log('where_application_email' , where_application_email)
          console.log('where_student_name' , where_student_name)
          console.log('where_source_from' , where_source_from)
          console.log('where_portal_wise_condition' , where_portal_wise_condition)
          console.log('where_order_id' , where_order_id)
          console.log('limitOffset' , limitOffset)
          console.log('where_date' , where_date)
          console.log('where_super_roles' , where_super_roles)
          console.log('whereDateValidation' , whereDateValidation)
    return sequelize.query('CALL SP_getApplicationByUser_guAdmin(:where_tracker, :where_status, :where_application_id, :where_application_email, :where_student_name, :where_source_from, :where_portal_wise_condition, :where_order_id, :limitOffset, :where_date,:where_super_roles ,:whereDateValidation :where_superuniversity_roles)', {
      replacements: { 
        where_tracker: where_tracker || " ",
        where_status : where_status || " ",
        where_application_id : where_application_id || " ",
        where_application_email : where_application_email || " ",
        where_student_name : where_student_name || " ",
        where_source_from :  where_source_from || " ",
        where_portal_wise_condition : where_portal_wise_condition || " ",
        where_order_id : where_order_id || " ",
        limitOffset : limitOffset || " ",
        where_date : where_date || " ",
        where_super_roles : where_super_roles || " ",
        whereDateValidation : whereDateValidation || ' ',
        where_superuniversity_roles : where_superuniversity_roles || ' ',
      },
      type: sequelize.QueryTypes.RAW
    });
  };

Application.getApplicationByUser_count_wes = function(filters,tracker,status,limit,offset,userRole,attest,verify) {
    var where_student_name = '',
      where_application_id = '',
      where_application_email = '',
      where_source_from = '',
      where_tracker = '',
      where_status = '',
      where_super_roles = '',
      where_order_id = '',
      where_portal_wise_condition = '';

    var where_attest = '',
      where_convo = '',
      where_pdc = '',
      where_migration = '',
      where_verify = '',
      where_syverify = '';
    var limitOffset = '';
    if (filters.length > 0) {
filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
    }  else if (filter.name == "application_id") {
          where_application_id = " AND app.id = " + filter.value + " ";
        } else if (filter.name == "email") {
      where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
    } else if(filter.name == 'source_from'){
          where_source_from = " AND app.source_from = '" + filter.value + "' ";
    } else if(filter.name == "order_id"){
          where_order_id = " AND o.id = " + filter.value + " ";
        }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
if(tracker != null){
if(tracker == 'signed'){
        where_tracker = " AND (app.tracker = '" + tracker + "' or app.tracker = 'print_signed') and  (app.print_signedstatus = 'print' or app.print_signedstatus = 'print_signed') ";
      }
else if(tracker == 'print'){
        where_tracker = " AND (app.tracker = '" + tracker + "' or app.tracker = 'print_signed') and  (app.print_signedstatus = 'signed  ' or app.print_signedstatus = 'print_signed') ";
      }

else{
        where_tracker = " AND app.tracker = '" + tracker + "'";
      }

    }
if(tracker =='signed' && status != null){
      where_status = " AND app.status in  ('accept', 'printreject')";
}else if(status != null){
      where_status = " AND app.status = '" + status + "'";
    }


if(userRole != null){
      where_super_roles = " AND app.source_from in " + userRole + " ";
    }

if(userRole.includes('guattestation')){
where_attest = attest ;
    }

if(userRole.includes('guconvocation')){
      where_convo = ' OR (ed.app_id is not null) '; // Condition not written as portal is not working
    }

if(userRole.includes('gumigration')){
      where_migration = ' OR (aed.app_id is not null) ';
    }

if(userRole.includes('pdc') || userRole.includes('guinternship')){
      where_pdc = ' OR (ed.app_id is not null)  ';
    }

if(userRole.includes('guverification')){
      where_verify = verify;
    }

if(userRole.includes('gusyverification')){
      where_syverify = ' OR (vt.secondYear = 1) ';
    }

if(userRole.includes())

if(attest && verify){
where_portal_wise_condition = ' AND ( '+ where_attest + where_convo + where_migration + where_pdc + where_verify + where_syverify+ ' )'
      }
  var query = "SELECT count(app.user_id) as cnt";
    query += " FROM Application AS app ";
    query += " Join User AS usr ON usr.id = app.user_id ";
    query += " LEFT Join Orders AS o ON o.application_id = app.id "
    // query += " LEFT JOIN Applied_For_Details AS afd ON afd.app_id = app.id "
    // query += " LEFT JOIN VerificationTypes AS vt ON vt.app_id = app.id "
    // query += " LEFT JOIN Applicant_Educational_Details AS aed ON aed.app_id = app.id "
    // query += " LEFT JOIN edu_details AS ed ON ed.app_id = app.id "
    // query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_mark ON att_ued_mark.application_id = app.id AND att_ued_mark.type = 'marksheets'"
    // query+="LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_tran ON att_ued_tran.application_id = app.id AND att_ued_tran.type = 'transcript'"
    // query+="LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_deg ON att_ued_deg.application_id = app.id AND att_ued_deg.type = 'degree'"
    // query+="LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_inst ON att_ued_inst.application_id = app.id AND att_ued_inst.type = 'instructional'"
    // query+="LEFT JOIN MDT_User_Enrollment_Detail AS mdt_mark ON mdt_mark.application_id = app.id AND mdt_mark.MDT_type = 'marksheet'"
    // query+="LEFT JOIN MDT_User_Enrollment_Detail AS mdt_tran ON mdt_tran.application_id = app.id AND mdt_tran.MDT_type = 'transcript'"
    //// query+="LEFT JOIN MDT_User_Enrollment_Detail AS mdt_deg ON mdt_deg.application_id = app.id AND mdt_deg.MDT_type = 'degree'"
    //query+="LEFT JOIN SY_User_Enrollment_Detail AS sy ON sy.application_id = app.id"
    query += " LEFT JOIN Institution_details AS inst_attest ON inst_attest.app_id = app.id "
    // query += " LEFT JOIN InstituteDetails AS inst_verify ON inst_verify.app_id = app.id "
    query += " WHERE 1 = 1";
    query += where_tracker;
    query += where_status;
    query += where_application_id;
    query += where_application_email;
    query += where_student_name;
    query += where_source_from;
    query += where_portal_wise_condition;
    query += where_super_roles;
    query += where_order_id;
query+=" and inst_attest.type like '%Educational credential evaluators WES%'"
return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};

  Application.getAgentName = function(user_id){
    query = `select marksheetName from User where id = (select agent_id from User where id = ${user_id});`
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Application.getApplicationByUser_count = function(filters,tracker,status,limit,offset,userRole, universityRole, attest,verify,emailId) {
    var whereDateValidation = '' ;
    var where_student_name = '',
      where_application_id = '',
      where_application_email = '',
      where_source_from = '',
      where_tracker = '',
      where_status = '',
      where_super_roles = '',
      where_superuniversity_roles = '',
      where_order_id = '',
      where_portal_wise_condition = '';

    var where_attest = '',
      where_convo = '',
      where_pdc = '',
      where_migration = '',
      where_verify = '',
      where_syverify = '';
    var limitOffset = '';
    if(!emailId.includes('@edulab.in')){
       whereDateValidation =  " AND DATE(app.created_at) < '2023-12-23'";
    }
    if (filters.length > 0) {
  filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
      }  else if (filter.name == "application_id") {
          where_application_id = " AND app.id = " + filter.value + " ";
        } else if (filter.name == "email") {
        where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
      } else if(filter.name == 'source_from'){
          where_source_from = " AND app.source_from = '" + filter.value + "' ";
      } else if(filter.name == "order_id"){
          where_order_id = " AND o.id = " + filter.value + " ";
        }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
if(tracker != null){
  if(tracker == 'signed'){
        where_tracker = " AND (app.tracker = '" + tracker + "' or app.tracker = 'print_signed') and  (app.print_signedstatus = 'print' or app.print_signedstatus = 'print_signed') ";
      }
  else if(tracker == 'print'){
        where_tracker = " AND (app.tracker = '" + tracker + "' or app.tracker = 'print_signed') and  (app.print_signedstatus = 'signed  ' or app.print_signedstatus = 'print_signed') ";
      }

  else{
        where_tracker = " AND app.tracker = '" + tracker + "'";
      }

    }
if(tracker =='signed' && status != null){
      where_status = " AND app.status in  ('accept', 'printreject')";
}else if(status != null){
      where_status = " AND app.status = '" + status + "'";
    }


if(userRole != null){
      where_super_roles = " AND app.source_from in " + userRole + " ";
    }
if(universityRole != null){
      where_superuniversity_roles = " AND app.university in " + universityRole + " ";
    }

if(userRole.includes('guattestation')){
  where_attest = attest ;
    }

if(userRole.includes('guconvocation')){
      where_convo = ' OR (ed.app_id is not null) '; // Condition not written as portal is not working
    }

if(userRole.includes('gumigration')){
      where_migration = ' OR (aed.app_id is not null) ';
    }

if(userRole.includes('pdc') || userRole.includes('guinternship')){
      where_pdc = ' OR (ed.app_id is not null)  ';
    }

if(userRole.includes('guverification')){
      where_verify = verify;
    }

if(userRole.includes('gusyverification')){
      where_syverify = ' OR (vt.secondYear = 1) ';
    }

if(userRole.includes())

if(attest && verify){
  where_portal_wise_condition = ' AND ( '+ where_attest + where_convo + where_migration + where_pdc + where_verify + where_syverify+ ' )'
      }

    var query = "SELECT count(app.user_id) as cnt";
    query += " FROM Application AS app ";
    query += " Join User AS usr ON usr.id = app.user_id ";
    query += " LEFT Join Orders AS o ON o.application_id = app.id "
    // query += " LEFT JOIN Applied_For_Details AS afd ON afd.app_id = app.id "
    // query += " LEFT JOIN VerificationTypes AS vt ON vt.app_id = app.id "
    // query += " LEFT JOIN Applicant_Educational_Details AS aed ON aed.app_id = app.id "
    // query += " LEFT JOIN edu_details AS ed ON ed.app_id = app.id "
    // query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_mark ON att_ued_mark.application_id = app.id AND att_ued_mark.type = 'marksheets'"
    // query+="LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_tran ON att_ued_tran.application_id = app.id AND att_ued_tran.type = 'transcript'"
    // query+="LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_deg ON att_ued_deg.application_id = app.id AND att_ued_deg.type = 'degree'"
    // query+="LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_inst ON att_ued_inst.application_id = app.id AND att_ued_inst.type = 'instructional'"
    // query+="LEFT JOIN MDT_User_Enrollment_Detail AS mdt_mark ON mdt_mark.application_id = app.id AND mdt_mark.MDT_type = 'marksheet'"
    // query+="LEFT JOIN MDT_User_Enrollment_Detail AS mdt_tran ON mdt_tran.application_id = app.id AND mdt_tran.MDT_type = 'transcript'"
    //// query+="LEFT JOIN MDT_User_Enrollment_Detail AS mdt_deg ON mdt_deg.application_id = app.id AND mdt_deg.MDT_type = 'degree'"
    //query+="LEFT JOIN SY_User_Enrollment_Detail AS sy ON sy.application_id = app.id"
    // query += " LEFT JOIN Institution_details AS inst_attest ON inst_attest.app_id = app.id "
    // query += " LEFT JOIN InstituteDetails AS inst_verify ON inst_verify.app_id = app.id "
    query += " WHERE 1 = 1";
    query += where_tracker;
    query += where_status;
    query += where_application_id;
    query += where_application_email;
    query += where_student_name;
    query += where_source_from;
    query += where_portal_wise_condition;
    query += where_super_roles;
    query += where_superuniversity_roles;
    query += where_order_id;
    console.log('queryqueryquery' , query)
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };
  Application.getDeliveryTypeModeWiseAppCount = function(source_from,mode){
    var query = "SELECT count( DISTINCT(app.id) ) AS app_count from Application as app";
    query += " WHERE app.source_from = '" + source_from + "' AND app.deliveryTime = '" + mode + "' ";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }

  Application.getStudentReportDetails = function(filters,limit,offset) {
    var where_student_name = '',
      where_application_email = '';
    var limitOffset = '';
    if (filters.length > 0) {
      filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        }else if (filter.name == "email") {
          where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
        }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }

    var query = "SELECT CONCAT( usr.name, ' ', usr.surname ) AS name, usr.email, ";
    query += " JSON_ARRAYAGG(JSON_OBJECT( 'source_from', source.source_from ,'count', source.source_count )) AS app_data ";
    query += " FROM User as usr JOIN ";
    query += " (SELECT user_id, source_from, count(source_from) AS source_count ";
    query += " FROM Application GROUP BY user_id,source_from) source";
    query += " ON usr.id = source.user_id";
    query += " WHERE 1 = 1";
    query += where_application_email;
    query += where_student_name;
    query += " GROUP BY usr.id"
    query += limitOffset;

    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };
  Application.getApplicationByUser_wes = function(filters,tracker,status,limit,offset,userRole,attest,verify) {
    var where_student_name = '',
      where_application_id = '',
      where_application_email = '',
      where_source_from = '',
      where_tracker = '',
      where_status = '',
      where_super_roles = '',
      where_order_id = '',
      where_portal_wise_condition = '';
    where_date='';  

    var where_attest = '',
      where_convo = '',
      where_pdc = '',
      where_migration = '',
      where_verify = '',
      where_syverify = '';
    var limitOffset = '';
    if (filters.length > 0) {
  filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
      }  else if (filter.name == "application_id") {
          where_application_id = " AND app.id = " + filter.value + " ";
        } else if (filter.name == "email") {
        where_application_email = " AND usr.email like '%" + filter.value  + "%' ";
      } else if(filter.name == 'source_from'){
          where_source_from = " AND app.source_from = '" + filter.value + "' ";
      } else if(filter.name == "order_id"){
          where_order_id = " AND o.id = " + filter.value + " ";
        }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
if(tracker != null){
  if(tracker == 'signed'){
        where_tracker = " AND (app.tracker = '" + tracker + "' or app.tracker = 'print_signed') and  (app.print_signedstatus = 'print' or app.print_signedstatus = 'print_signed') ";
      }
  else if(tracker == 'print'){
        where_tracker = " AND (app.tracker = '" + tracker + "' or app.tracker = 'print_signed') and  (app.print_signedstatus = 'signed  ' or app.print_signedstatus = 'print_signed') ";
      }

  else{
        where_tracker = " AND app.tracker = '" + tracker + "'";
      }

    }
if(tracker =='signed' && status != null){
      where_status = " AND app.status in  ('accept', 'printreject')";
}else if(status != null){
      where_status = " AND app.status = '" + status + "'";
    }

if(tracker =='apply' ){
      where_date = "app.created_at";

}else if(tracker =='verified'){
      where_date = "app.verified_date";

}else if(tracker =='signed'|| tracker =='print'){
  where_date= "app.print_date";
}else if(tracker =='done'){
  where_date= "app.courier_date";
}else if(tracker =='printedulab'){
  where_date= "app.print_date";
}else {
      where_date = "app.created_at";
    }

if(userRole != null){
      where_super_roles = " AND app.source_from in " + userRole + " ";
    }

if(userRole.includes('guattestation')){
  where_attest = attest ;
    }

if(userRole.includes('guconvocation')){
      where_convo = ' OR (ed.app_id is not null) '; // Condition not written as portal is not working
    }

if(userRole.includes('gumigration')){
      where_migration = ' OR (aed.app_id is not null) ';
    }

if(userRole.includes('pdc') || userRole.includes('guinternship')){
      where_pdc = ' OR (ed.app_id is not null)  ';
    }

if(userRole.includes('guverification')){
      where_verify = verify;
    }

if(userRole.includes('gusyverification')){
      where_syverify = ' OR (vt.secondYear = 1) ';
    }

if(userRole.includes())

if(attest && verify){
  where_portal_wise_condition = ' AND ( '+ where_attest + where_convo + where_migration + where_pdc + where_verify + where_syverify+ ' )'
      }

    return sequelize.query('CALL sp_getApplication_User_Wes(:where_tracker, :where_status, :where_application_id, :where_application_email, :where_student_name, :where_source_from, :where_portal_wise_condition, :where_order_id, :limitOffset, :where_date,:where_super_roles)', {
      replacements: { 
        where_tracker: where_tracker || " ",
        where_status : where_status || " ",
        where_application_id : where_application_id || " ",
        where_application_email : where_application_email || " ",
        where_student_name : where_student_name || " ",
        where_source_from :  where_source_from || " ",
        where_portal_wise_condition : where_portal_wise_condition || " ",
        where_order_id : where_order_id || " ",
        limitOffset : limitOffset || " ",
        where_date : where_date || " ",
        where_super_roles : where_super_roles || " ",
      },
      type: sequelize.QueryTypes.RAW
    });
  };
  Application.getPieChart = function (roles,university) {
    console.log('rolesrolesroles' , roles)
    console.log('universityuniversity' , university)
    let where_super_roles= ''
    let where_super_university= ''
    if(roles != null){
      where_super_roles = " source_from in " + roles + " ";
    }

    if(university != null){
      where_super_university = " AND university in " + university + " ";
    }
    var query = "SELECT source_from, ";
    query += "COUNT(source_from)  AS countt, ";
    query += "SUM(CASE WHEN tracker = 'apply' THEN 1 ELSE 0 END) AS pending, ";
    query += "SUM(CASE WHEN tracker = 'verified' THEN 1 ELSE 0 END) AS verified, ";
    query += "SUM(CASE WHEN tracker = 'signed' THEN 1 ELSE 0 END) AS signed, ";
    query += "SUM(CASE WHEN tracker = 'print' THEN 1 ELSE 0 END) AS print, ";
    query += "SUM(CASE WHEN tracker = 'done' THEN 1 ELSE 0 END) AS done " ;
    query += "FROM Application where " + where_super_roles + where_super_university;
    query += " GROUP BY source_from";
    console.log('queryqueryqueryquery' , query)
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  };

      Application.getFileData = function(filter,limit,offset){
        var limitOffset='';
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
    var query = "SELECT verified_date, rackNo, rowNo, COUNT(verified_date) as app_count"
    query += " FROM Application WHERE tracker != 'apply' GROUP BY verified_date desc ";
    query += limitOffset;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  };

      Application.getVerifiedDataByDate = function(date){
    var query = "SELECT app.id as app_id, CONCAT(usr.name,' ', usr.surname) as name, usr.email, ";
    query += " CASE WHEN app.source_from = 'guverification' THEN 'Verification' ";
    query += " WHEN app.source_from = 'pdc' THEN 'Provisional Degree Certificate' ";
    query += " WHEN app.source_from = 'guconvocation' THEN 'Convocation Certificate' ";
    query += " WHEN app.source_from = 'guattestation' THEN 'Attestation' ";
    query += " WHEN app.source_from = 'gumigration' THEN 'Migration Certificate' ";
    query += " END AS service ";
    query += " FROM Application AS app JOIN User AS usr ON usr.id = app.user_id WHERE verified_date = '" + date + "'";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  };
      Application.getTotalpaid = function(filters,limit,offset) {
    var where_student_name = '';
    var where_order_id = '';
    var where_bank_ref_no = '',
      where_application_id = '',
      where_application_email = '',
      where_application_date = '';
    var limitOffset = '';
    if (filters.length > 0) {
        filters.forEach(function(filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        } else if (filter.name == "surname") {
          where_student_surname = " AND u.surname LIKE '%" + filter.value + "%' ";
        } else if (filter.name == "application_id") {
          where_application_id = " AND a.id = " + filter.value + " ";
        } else if (filter.name == "email") {
              where_application_email = " AND u.email like '%" + filter.value  + "%' ";
            } else if(filter.name == 'application_year'){
          where_application_date = filter.value;
        }
        else if (filter.name == 'order_id') {
          where_order_id = " AND o.id = " + filter.value + " ";
        }
        else if (filter.name == 'bank_ref_no') {
          where_bank_ref_no = "AND t.bank_ref_no LIKE '%" + filter.value + "%'"
        }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
    var query = "SELECT u.email,CONCAT(u.name,' ',u.surname) as name,u.mobile,a.created_at ,t.order_id,t.tracking_id,t.bank_ref_no, o.amount AS ord_amount,t.split_status,a.id,a.source_from FROM ";
    query += "Application as a JOIN User as u on u.id = a.user_id JOIN orders";
    query += " as o on u.id = o.user_id JOIN transaction as t";
    query += " on o.id = t.order_id ";
    query += where_application_id;
    query += where_application_email;
    query += where_student_name;
    query += where_application_date;
    query += where_order_id;
    query += where_bank_ref_no;
    query += " ORDER BY a.created_at desc ";
    query += limitOffset;
        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  };

  Application.downloadExcel_date = function (startDate, endDate) {
    var whereCreated_at = '';
    if (startDate && endDate) {
      whereCreated_at = 'and a.created_at BETWEEN "' + startDate + '" AND "' + endDate + '"'
    }
    var query = "SELECT u.email,CONCAT(u.name,' ',u.surname) as name,u.mobile,a.created_at ,t.order_id,t.tracking_id,t.bank_ref_no, o.amount AS ord_amount,t.split_status,a.id,a.source_from FROM ";
    query += "Application as a JOIN User as u on u.id = a.user_id JOIN orders";
    query += " as o on u.id = o.user_id JOIN transaction as t";
    query += " on o.id = t.order_id ";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  }

      Application.getDateWiseApplications=function(tracker,status,userRole,startDate,endDate,service){
    var where_date = '';
    var whereCreated_at = ''
    where_tracker = '',
      where_status = '',
      where_super_roles = '';
    service_where = '';
        try{
          if(tracker != null){
        where_tracker = " AND app.tracker = '" + tracker + "'";
      }
          if(status != null){
        where_status = " AND app.status = '" + status + "'";
      }
          if(userRole != null){
        where_super_roles = " AND app.source_from in " + userRole + " ";
      }

          if(startDate && endDate){
            whereCreated_at = '  app.created_at BETWEEN "'+startDate+'" AND "'+endDate+'" and '
      }
          if(service && service != 'null'){
        service_where = ' and app.source_from = "' + service + '"'
      }

          if(tracker =='apply' ){
        where_date = "app.created_at";
          }else if(tracker =='verified'){
        where_date = "app.verified_date";
          }else if(tracker =='signed'|| tracker =='print'){
            where_date= "app.print_date";
          }else if(tracker =='done'){
            where_date= "app.courier_date";
          }else if(tracker =='printedulab'){
            where_date= "app.print_date";
          }else { 
        where_date = "app.created_at";
      }
      var query = " SELECT app.id AS app_id,app.source_from as Service,usr.marksheetName,app.inward,app.wes_error,app.created_at, ";
      query += " IF(usr.marksheetName, usr.marksheetName, usr.fullname) AS NAME, usr.email, app.STATUS, app.total_amount,";
      query += " CONCAT(usr.mobile_country_code,'-', usr.mobile) AS contactNumber, usr.id AS user_id, app.tracker, ";
      query += " CONCAT (CASE WHEN ( app.source_from = 'guattestation' OR app.source_from = 'gumoi' ) THEN ";
      query += " (CASE WHEN ( afd.instructionalField = 1 ) THEN ( 'MOI' ) ELSE ( afd.attestedfor ) END ) ELSE '' END, ";
      query += " CASE WHEN ( app.source_from = 'guverification' ) THEN ( "
      query += " CONCAT( CASE WHEN vt.marksheet = TRUE THEN ";
      query += " CONCAT( 'Marksheet Verification(', vt.noOfMarksheet, '),' ) ELSE '' END, ";
      query += " CASE WHEN vt.transcript = TRUE THEN CONCAT( 'Transcript Verification(', vt.noOfTranscript, '),' ) ELSE '' END,";
      query += " CASE WHEN vt.degreeCertificate = TRUE THEN CONCAT( 'Degree Certificate Verification(', vt.noOfDegree, '),' ) ELSE '' END ";
      query += ") ) ELSE '' END ) AS Applied_For, ";
      query += " CONCAT ( CASE WHEN ( app.source_from = 'guattestation' OR app.source_from = 'gumoi' ) ";
      query += " THEN app.deliveryType ELSE '' END, ";
      query += " CASE WHEN ( app.source_from = 'guverification' OR app.source_from = 'gusyverification' ) THEN ";
      query += " ( CASE WHEN vt.sealedCover = TRUE THEN CONCAT( 'Sealed Copy(', vt.noOfCopies, '),' ) ELSE 'Digital' END )";
      query += " ELSE '' END) AS Sending_Type, ";
      query += " CONCAT( IF(app.source_from = 'guverification', ";
      query += " CONCAT( CASE WHEN ( vt.marksheet = TRUE) THEN ";
      query += " ( CONCAT('Marksheet(', mdt_mark.outward,')' ) ) ELSE '' END, ";
      query += " CASE WHEN ( vt.transcript = TRUE ) THEN ( CONCAT('Transcript(', mdt_tran.outward,')' ) ) ELSE '' END, ";
      query += " CASE WHEN ( vt.degreeCertificate = TRUE ) THEN ( CONCAT('Degree Certificate(', mdt_deg.outward,')' ) ) ";
      query += " ELSE '' END ),'' ), ";
      query += " IF(app.source_from = 'guattestation', CONCAT(CASE WHEN ( afd.attestedfor like '%marksheet%' ) THEN ";
      query += " ( CONCAT('Marksheet(',att_ued_mark.outward,')' ) )ELSE '' END, ";
      query += " CASE WHEN ( afd.attestedfor like '%transcript%' ) THEN ( CONCAT('Transcript(',att_ued_tran.outward,')')) ELSE '' END,";
      query += " CASE WHEN ( afd.attestedfor like '%degree%' ) THEN ( CONCAT('Degree Certificate(',att_ued_deg.outward,')')) ELSE '' END ),'' ), ";
      query += " IF(app.source_from = 'gusyverification', CONCAT( CASE WHEN ( vt.secondYear = TRUE) THEN ( CONCAT('Second Year Marksheet(',sy.outward,')' ) ) ELSE '' END ),'' ), ";
      query += " IF(app.source_from = 'gumoi', CONCAT( CASE WHEN ( afd.instructionalField = 1) THEN ( CONCAT('Medium of Instruction(',att_ued_inst.outward,')' ) ) ELSE '' END ), '' ),"
      query += " IF(app.source_from = 'pdc', app.outward, '' ) ) AS outward, app.approved_by as verifiedBy, "
      query += " app.verified_date as verifiedDate, app.verified_by as printBy, app.print_date as printDate, ";
          query += " app.print_by as sentBy,app.signed_date, app.courier_date as sentDate,DATEDIFF(CURRENT_DATE(), "+where_date+" ) as pending FROM Application AS app ";
      query += " JOIN User AS usr ON usr.id = app.user_id ";
      query += " LEFT JOIN Orders AS o ON o.application_id = app.id ";
      query += " LEFT JOIN Applied_For_Details AS afd ON afd.app_id = app.id ";
      query += " LEFT JOIN VerificationTypes AS vt ON vt.app_id = app.id ";
      query += " LEFT JOIN Applicant_Educational_Details AS aed ON aed.app_id = app.id ";
      query += " LEFT JOIN edu_details AS ed ON ed.app_id = app.id ";
      query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_mark "
      query += " ON att_ued_mark.application_id = app.id AND att_ued_mark.type = 'marksheet' ";
      query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_tran ";
      query += " ON att_ued_tran.application_id = app.id AND att_ued_tran.type = 'transcript' ";
      query += "LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_deg ";
      query += " ON att_ued_deg.application_id = app.id AND att_ued_deg.type = 'degree' ";
      query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_inst ";
      query += " ON att_ued_inst.application_id = app.id AND att_ued_inst.type = 'instructional' ";
      query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_mark ON mdt_mark.application_id = app.id ";
      query += " AND mdt_mark.MDT_type = 'marksheet' ";
      query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_tran ON mdt_tran.application_id = app.id ";
      query += " AND mdt_tran.MDT_type = 'transcript' ";
      query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_deg ON mdt_deg.application_id = app.id ";
      query += " AND mdt_deg.MDT_type = 'degree' ";
      query += " LEFT JOIN SY_User_Enrollment_Detail AS sy ON sy.application_id = app.id ";
          query += " WHERE ( "+whereCreated_at
          query += " app.tracker = '"+tracker+"' AND app.status = '"+status + "' " + service_where + ") ";
      query += " GROUP BY app.user_id ORDER BY app.created_at ASC";
          return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
        }catch(e){
    }
  }

      Application.getDateWiseApplications_wes=function(tracker,status,userRole,startDate,endDate,service){ 
    var whereCreated_at = '',
      where_tracker = '',
      where_status = '',
      where_super_roles = '';
    service_where = '';
    where_date = '';
        try{
          if(tracker != null){
        where_tracker = " AND app.tracker = '" + tracker + "'";
      }
          if(status != null){
        where_status = " AND app.status = '" + status + "'";
      }
          if(userRole != null){
        where_super_roles = " AND app.source_from in " + userRole + " ";
      }

          if(startDate && endDate){
            whereCreated_at = '  app.created_at BETWEEN "'+startDate+'" AND "'+endDate+'" and '
      }

          if(service && service != 'null'){
        service_where = ' and app.source_from = "' + service + '"'
      }

          if(tracker =='apply' ){
        where_date = "app.created_at";
        }else if(tracker =='verified'){
        where_date = "app.verified_date";
        }else if(tracker =='signed'|| tracker =='print'){
          where_date= "app.print_date";
        }else if(tracker =='done'|| tracker =='wes'){
          where_date= "app.courier_date";
        }else if(tracker =='printedulab'){
          where_date= "app.print_date";
        }else {
        where_date = "app.created_at";
      }

      var query = " SELECT app.id AS app_id,app.source_from as Service,usr.marksheetName,app.inward, ";
      query += " IF(usr.marksheetName, usr.marksheetName, usr.fullname) AS NAME, usr.email, app.STATUS, app.total_amount,";
      query += " CONCAT(usr.mobile_country_code,'-', usr.mobile) AS contactNumber, usr.id AS user_id, app.tracker, ";
      query += " CONCAT (CASE WHEN ( app.source_from = 'guattestation' OR app.source_from = 'gumoi' ) THEN ";
      query += " (CASE WHEN ( afd.instructionalField = 1 ) THEN ( 'MOI' ) ELSE ( afd.attestedfor ) END ) ELSE '' END, ";
      query += " CASE WHEN ( app.source_from = 'guverification' ) THEN ( "
      query += " CONCAT( CASE WHEN vt.marksheet = TRUE THEN ";
      query += " CONCAT( 'Marksheet Verification(', vt.noOfMarksheet, '),' ) ELSE '' END, ";
      query += " CASE WHEN vt.transcript = TRUE THEN CONCAT( 'Transcript Verification(', vt.noOfTranscript, '),' ) ELSE '' END,";
      query += " CASE WHEN vt.degreeCertificate = TRUE THEN CONCAT( 'Degree Certificate Verification(', vt.noOfDegree, '),' ) ELSE '' END ";
      query += ") ) ELSE '' END ) AS Applied_For, ";
      query += " CONCAT ( CASE WHEN ( app.source_from = 'guattestation' OR app.source_from = 'gumoi' ) ";
      query += " THEN app.deliveryType ELSE '' END, ";
      query += " CASE WHEN ( app.source_from = 'guverification' OR app.source_from = 'gusyverification' ) THEN ";
      query += " ( CASE WHEN vt.sealedCover = TRUE THEN CONCAT( 'Sealed Copy(', vt.noOfCopies, '),' ) ELSE 'Digital' END )";
      query += " ELSE '' END) AS Sending_Type, ";
      query += " CONCAT( IF(app.source_from = 'guverification', ";
      query += " CONCAT( CASE WHEN ( vt.marksheet = TRUE ) THEN ";
      query += " ( CONCAT('Marksheet(', mdt_mark.outward,')' ) ) ELSE '' END, ";
      query += " CASE WHEN ( vt.transcript = TRUE ) THEN ( CONCAT('Transcript(', mdt_tran.outward,')' ) ) ELSE '' END, ";
      query += " CASE WHEN ( vt.degreeCertificate = TRUE ) THEN ( CONCAT('Degree Certificate(', mdt_deg.outward,')' ) ) ";
      query += " ELSE '' END ),'' ), ";
      query += " IF(app.source_from = 'guattestation', CONCAT(CASE WHEN ( afd.attestedfor like '%marksheet%' ) THEN ";
      query += " ( CONCAT('Marksheet(',att_ued_mark.outward,')' ) )ELSE '' END, ";
      query += " CASE WHEN ( afd.attestedfor like '%transcript%' ) THEN ( CONCAT('Transcript(',att_ued_tran.outward,')')) ELSE '' END,";
      query += " CASE WHEN ( afd.attestedfor like '%degree%' ) THEN ( CONCAT('Degree Certificate(',att_ued_deg.outward,')')) ELSE '' END ),'' ), ";
      query += " IF(app.source_from = 'gusyverification', CONCAT( CASE WHEN ( vt.secondYear = TRUE) THEN ( CONCAT('Second Year Marksheet(',sy.outward,')' ) ) ELSE '' END ),'' ), ";
      query += " IF(app.source_from = 'gumoi', CONCAT( CASE WHEN ( afd.instructionalField = 1) THEN ( CONCAT('Medium of Instruction(',att_ued_inst.outward,')' ) ) ELSE '' END ), '' ),"
      query += " IF(app.source_from = 'pdc', app.outward, '' ) ) AS outward, app.approved_by as verifiedBy, "
      query += " app.verified_date as verifiedDate, app.verified_by as printBy, app.print_date as printDate, ";
      query += " app.print_by as sentBy,app.signed_date, app.courier_date as sentDate FROM Application AS app ";
      query += " JOIN User AS usr ON usr.id = app.user_id ";
      query += " LEFT JOIN Orders AS o ON o.application_id = app.id ";
      query += " LEFT JOIN Applied_For_Details AS afd ON afd.app_id = app.id ";
      query += " LEFT JOIN VerificationTypes AS vt ON vt.app_id = app.id ";
      query += " LEFT JOIN Applicant_Educational_Details AS aed ON aed.app_id = app.id ";
      query += " LEFT JOIN edu_details AS ed ON ed.app_id = app.id ";
      query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_mark "
      query += " ON att_ued_mark.application_id = app.id AND att_ued_mark.type = 'marksheet' ";
      query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_tran ";
      query += " ON att_ued_tran.application_id = app.id AND att_ued_tran.type = 'transcript' ";
      query += "LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_deg ";
      query += " ON att_ued_deg.application_id = app.id AND att_ued_deg.type = 'degree' ";
      query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_inst ";
      query += " ON att_ued_inst.application_id = app.id AND att_ued_inst.type = 'instructional' ";
      query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_mark ON mdt_mark.application_id = app.id ";
      query += " AND mdt_mark.MDT_type = 'marksheet' ";
      query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_tran ON mdt_tran.application_id = app.id ";
      query += " AND mdt_tran.MDT_type = 'transcript' ";
      query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_deg ON mdt_deg.application_id = app.id ";
      query += " AND mdt_deg.MDT_type = 'degree' ";
      query += " LEFT JOIN SY_User_Enrollment_Detail AS sy ON sy.application_id = app.id ";
      query += " LEFT JOIN Institution_details AS inst ON inst.app_id = app.id ";
          query += " WHERE ( "+whereCreated_at
          query += "  app.tracker = '"+tracker+"' AND app.status = '"+status + "' " + ' and  inst.type like "%Educational credential evaluators WES%" ' + ") ";      
      query += " GROUP BY app.user_id ORDER BY app.created_at ASC";
          return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
        }catch(e){
    }

  }

  Application.download=function(superRoles,startDate, endDate,service){
var startDate_new ='';
var end_date_new='';
var  service_where = '';

if(startDate && endDate){
  startDate_new=startDate
  end_date_new=endDate
}else{
startDate_new='2023-01-01'
end_date_new= moment(new Date()).format('YYYY-MM-DD')

}
if(service && service != 'null'){
service_where = "('" + service + "')"
}else{
service_where =  superRoles 
}

return sequelize.query('CALL total_download(:service,:start_date,:end_date)', {
  replacements: { 
    service: service_where || " ",
    start_date:startDate_new || " ",
    end_date :end_date_new ||" "
  },
  type: sequelize.QueryTypes.RAW
});
}

  Application.getApplicationByUser_wesRangeWise = function (filters, tracker, status, limit, offset, userRole, attest, verify, startDate, endDate) {
    var where_student_name = '',
      where_application_id = '',
      where_application_email = '',
      where_source_from = '',
      where_tracker = '',
      where_status = '',
      where_super_roles = '',
      where_portal_wise_condition = '';

    var where_attest = '',
      where_convo = '',
      where_pdc = '',
      where_migration = '',
      where_verify = '';
    var limitOffset = '';
    if (filters.length > 0) {
      filters.forEach(function (filter) {
        if (filter.name == "name") {
          where_student_name = filter.value;
        } else if (filter.name == "application_id") {
          where_application_id = " AND app.id = " + filter.value + " ";
        } else if (filter.name == "email") {
          where_application_email = " AND usr.email like '%" + filter.value + "%' ";
        } else if (filter.name == 'source_from') {
          where_source_from = " AND app.source_from = '" + filter.value + "' ";
        }
      });
    }
    if (limit != null && offset != null) {
      limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
    }
    if (tracker != null) {
      where_tracker = " AND app.tracker = '" + tracker + "'";
    }
    if (status != null) {
      where_status = " AND app.status = '" + status + "'";
    }
    if (userRole != null) {
      where_super_roles = " AND app.source_from in " + userRole + " ";
    }

    if (userRole.includes('guattestation')) {
      where_attest = attest;
    }

    if (userRole.includes('guconvocation')) {
      where_convo = ' OR (ed.app_id is not null) '; // Condition not written as portal is not working
    }

    if (userRole.includes('gumigration')) {
      where_migration = ' OR (aed.app_id is not null) ';
    }

    if (userRole.includes('pdc') || userRole.includes('guinternship')) {
      where_pdc = ' OR (ed.app_id is not null)  ';
    }

    if (userRole.includes('guverification')) {
      where_verify = verify;
    }

    if (attest && verify) {
      where_portal_wise_condition = ' AND ( ' + where_attest + where_convo + where_migration + where_pdc + where_verify + ' )'
    }

    var query = "SELECT app.id AS app_id,app.source_from as Service,usr.marksheetName,app.created_at,";
    query += " inst_det.wesno AS WES_No, IF(usr.marksheetName, usr.marksheetName, usr.fullname) AS NAME,";
    query += " usr.email, CONCAT(usr.mobile_country_code,'-', usr.mobile) AS contactNumber, usr.id AS user_id, ";
    query += " app.tracker, app.STATUS, app.total_amount, ";
    query += " CONCAT (CASE WHEN ( app.source_from = 'guattestation' OR app.source_from = 'gumoi' ) THEN "
    query += " (CASE WHEN ( afd.instructionalField = 1 ) THEN ( 'MOI' ) ELSE ( afd.attestedfor ) END ) ELSE '' END, ";
    query += " CASE WHEN ( app.source_from = 'guverification' ) THEN ";
    query += " ( CONCAT( CASE WHEN vt.marksheet = TRUE THEN ";
    query += " CONCAT( 'Marksheet Verification(', vt.noOfMarksheet, '),' ) ELSE '' END, ";
    query += " CASE WHEN vt.transcript = TRUE THEN CONCAT('Transcript Verification(', vt.noOfTranscript,'),' ) ELSE '' END,";
    query += " CASE WHEN vt.degreeCertificate = TRUE THEN ";
    query += " CONCAT( 'Degree Certificate Verification(', vt.noOfDegree, '),' ) ELSE '' END ) ) ELSE '' END ) AS Applied_For,";
    query += " CONCAT ( CASE WHEN ( app.source_from = 'guattestation' OR app.source_from = 'gumoi' ) "
    query += " THEN app.deliveryType ELSE '' END, ";
    query += " CASE WHEN ( app.source_from = 'guverification' OR app.source_from = 'gusyverification' ) ";
          qeury +=" THEN ( CASE WHEN vt.sealedCover = TRUE THEN CONCAT( 'Sealed Copy(', vt.noOfCopies, '),' ) ELSE 'Digital' END )";
    query += " ELSE '' END) AS Sending_Type, ";
    query += " CONCAT( IF(app.source_from = 'guverification', ";
    query += " CONCAT( CASE WHEN ( vt.marksheet = TRUE ) THEN ";
    query += " ( CONCAT('Marksheet(', mdt_mark.outward,')' ) ) ELSE '' END, ";
    query += " CASE WHEN ( vt.transcript = TRUE ) THEN ( CONCAT('Transcript(', mdt_tran.outward,')' ) ) ELSE '' END, ";
    query += " CASE WHEN ( vt.degreeCertificate = TRUE ) THEN ";
    query += " ( CONCAT('Degree Certificate(', mdt_deg.outward,')' ) ) ELSE '' END ),'' ), ";
    query += " IF(app.source_from = 'guattestation', CONCAT(CASE WHEN ( afd.attestedfor like '%marksheet%' ) THEN ";
    query += " ( CONCAT('Marksheet(',att_ued_mark.outward,')' ) )ELSE '' END, ";
    query += " CASE WHEN ( afd.attestedfor like '%transcript%' ) THEN ";
    query += " ( CONCAT('Transcript(',att_ued_tran.outward,')' ) ) ELSE '' END, ";
    query += " CASE WHEN ( afd.attestedfor like '%degree%' ) THEN ";
    query += " ( CONCAT('Degree Certificate(',att_ued_deg.outward,')' ) ) ELSE '' END ),'' ), ";
    query += " IF(app.source_from = 'gusyverification', CONCAT( CASE WHEN ( vt.secondYear = TRUE) THEN ";
    query += " ( CONCAT('Second Year Marksheet(',sy.outward,')' ) ) ELSE '' END ),'' ), ";
    query += " IF(app.source_from = 'gumoi', CONCAT( CASE WHEN ( afd.instructionalField = 1) THEN ";
    query += " ( CONCAT('Medium of Instruction(',att_ued_inst.outward,')' ) ) ELSE '' END ), '' ), ";
    query += " IF(app.source_from = 'pdc', app.outward, '' ) ) AS outward, app.approved_by as verifiedBy, ";
    query += " app.verified_date as verifiedDate, app.verified_by as printBy, app.print_date as printDate, ";
    query += " app.print_by as sentBy, app.courier_date as sentDate FROM Application AS app ";
    query += " JOIN User AS usr ON usr.id = app.user_id ";
    query += " LEFT JOIN Institution_details AS inst_det ON inst_det.app_id = app.id ";
    query += " LEFT JOIN Orders AS o ON o.application_id = app.id ";
    query += " LEFT JOIN Applied_For_Details AS afd ON afd.app_id = app.id ";
    query += " LEFT JOIN VerificationTypes AS vt ON vt.app_id = app.id ";
    query += " LEFT JOIN Applicant_Educational_Details AS aed ON aed.app_id = app.id ";
    query += " LEFT JOIN edu_details AS ed ON ed.app_id = app.id ";
    query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_mark ";
    query += " ON att_ued_mark.application_id = app.id AND att_ued_mark.type = 'marksheet' ";
    query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_tran ";
    query += " ON att_ued_tran.application_id = app.id AND att_ued_tran.type = 'transcript' ";
    query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_deg ";
    query += " ON att_ued_deg.application_id = app.id AND att_ued_deg.type = 'degree' ";
    query += " LEFT JOIN User_Course_Enrollment_Detail_Attestation AS att_ued_inst ";
    query += " ON att_ued_inst.application_id = app.id AND att_ued_inst.type = 'instructional' ";
    query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_mark ON mdt_mark.application_id = app.id ";
    query += " AND mdt_mark.MDT_type = 'marksheet' ";
    query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_tran ON mdt_tran.application_id = app.id ";
    query += " AND mdt_tran.MDT_type = 'transcript' ";
    query += " LEFT JOIN MDT_User_Enrollment_Detail AS mdt_deg ON mdt_deg.application_id = app.id ";
    query += " AND mdt_deg.MDT_type = 'degree' ";
    query += " LEFT JOIN SY_User_Enrollment_Detail AS sy ON sy.application_id = app.id ";
    query += " WHERE ( DATE(app.created_at) >= '"+startDate+"' and DATE(app.created_at) <= '"+endDate+"' ";
    query += " and app.tracker = '"+tracker+"' AND app.status = '"+status+"'  ";
    query += " and app.source_from = 'guattestation') GROUP BY app.user_id ORDER BY app.created_at ASC";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  };

  return Application;
};
