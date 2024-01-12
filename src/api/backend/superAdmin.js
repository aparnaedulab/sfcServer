var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');
const config = require('config');
const express = require('express');
var router = express.Router();
const { FILE_LOCATION } = config.get('path');
const { BASE_URL_SENDGRID } = config.get('email');
const { serverUrl, clientUrl } = config.get('api');
var functions = require(root_path+'/utils/function');
var cron = require('node-cron');
var request = require('request');
var cipher = require(root_path+'/api/common/auth/cipherHelper');
var moment = require('moment');
var async = require('async');
const multer = require('multer');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
var json2xls = require('json2xls');
var fs = require('fs');
var urlencode = require('urlencode');
var converter = require('number-to-words');
const {VERIFY_BASE_URL,SY_VERIFY_BASE_URL,CONVOCATION_BASE_URL,PDC_BASE_URL,MIGRATION_BASE_URL,ATTESTATION_BASE_URL,intership_BASE_URL,MOI_BASE_URL,edulabAllow} = config.get("api");
const { getUserRole } = require('../common/auth/aclService');
var XLSX = require('xlsx');
const dbConfig ='/var/www';
const mysql = require('mysql2');
const e = require('express');
var romans = require('romans');
var converter = require('number-to-words');
var pdfreader = require('pdfreader');

const { HOST,
    USER,
    PASSWORD,
    port,
    DB,
    dialect,
    pool } = config.get('mysqldb');
const connection = mysql.createConnection({
    host: HOST,
    user: USER,
    database: DB,
    password: PASSWORD,
    port : port 
  });

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        const dir = dbConfig 
        // if there is errata then move existing files to backup directory then upload the new file to existing directory
        if (req.body.errataFlag) {
            let reqPath = path.join(__dirname, '../../../');
            var pathToApplication = path.join(reqPath, 'public', 'applications', req.body.id);
            fs.readdirSync(pathToApplication).forEach(file => {
                backupFileName = file
            })
            const backupDir = path.join(reqPath, 'public', 'backups', req.body.id);
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir);
                var oldPath = path.join(pathToApplication, backupFileName);
                var newPath = path.join(backupDir, backupFileName);//'new/path/file.txt'
                fs.rename(oldPath, newPath, function (err) {
                    if (err) throw err
                })
            }
            //Multiple times errata for file upload
            else {
                var src = path.join(reqPath, 'public', 'applications', req.body.id);
                var dest = path.join(reqPath, 'public', 'backups', req.body.id);
                copyRecursiveSync(src, dest)
            }
        }

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-')
        cb(null, fileName)
    },
})
var upload = multer({
    storage: storage,
    // limits: {
    //   fileSize: 1024 * 1024 * 5
    // },
    fileFilter: (req, file, cb) => {
        if (
            // file.mimetype == 'application/pdf' ||
            // file.mimetype == 'application/x-pdf'
            // //||
            file.mimetype == 'image/jpeg'
        ) {
            cb(null, true)
        } else {
            cb(null, false)
            return cb(new Error('Only .pdf format allowed!'))
        }
    },
})

/* Route : Save pickup details in application table   
Paramater : application id ,name ,user id,date and source_from*/
router.post('/pickupdate',  (req,res,next)=>{
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var user_id = req.body.user_id;
    var app_id = req.body.app_id;
    var date= req.body.date
    var name = req.body.name;
    var source_from = req.body.source_from;
    var source = '';
    if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/pickupdate',{json:{"app_id":app_id,"user_id":user_id,"email_admin":req.user.email,"date":date , "source" : source,"clientIP":clientIP,"name":name}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Pick Details Updated & Application Moved To Done.'
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/pickupdate',{json:{"app_id":app_id,"user_id":user_id,"email_admin":req.user.email,"date":date , "source" : source,"clientIP":clientIP,"name":name}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Pick Details Updated & Application Moved To Done.'
                    })
                }
            }
        })
    }
    else if(source_from == 'guattestation' || source_from == 'gumoi') {
        source = 'gu'
   
        request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/pending/pickupdate',{json:{"app_id":app_id,"user_id":user_id,"email_admin":req.user.email,"date":date , "source" : source,"clientIP":clientIP,"name":name}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Pick Details Updated & Application Moved To Done.'
                    })
                }
            }
        })
     }
})

router.post('/deleteDocument_Admin',  (req,res,next)=>{
    var id = req.body.id;
    var type = req.body.type;
    var source =  req.body.source;
    var filename =  req.body.filename;
    var app_id =  req.body.app_id;
    var user_id =  req.body.user_id;
    if(source == 'guverification' || source == 'gusyverification'){
        models.DocumentDetails.findOne({
            where :{
                id : id
            }
        }).then(function(docDetail){
            var documentName = docDetail.type + " " + docDetail.courseName + " " + docDetail.semester;
            var desc = req.user.email+" has been deleted document of "+documentName;
            var activity = "Delete Document";
            var appl_id = docDetail.app_id;
           
            models.DocumentDetails.destroy({
                where:{
                    id : id
                }
            }).then(function(deletedDoc){
                if(deletedDoc){
                    if(source == "guverification"){
                        functions.setVerificationTypes(appl_id,user_id,type,req);
                    }
                    functions.activitylog(req,user_id, activity, desc, docDetail.app_id, source);
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        status : 400
                    })
                }
            })
        })
    }else{
        let deletedvalue =  functions.deleteDocument(id,type,source,user_id,req);
        if(deletedvalue){
            var desc = "Document  named " + filename + " deleted " + " by "+  req.user.email;
            var activity = "Document Deleted";
            functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
            res.json({
                status : 200
            })
        }else{
            res.json({
                status : 400
            })
        }
    }
})

router.post('/pickupmail',  (req,res,next)=>{
    var user_id = req.body.user_id;
    var app_id = req.body.app_id;
    var date = req.body.date;
    var time = req.body.time;
    var source_from = req.body.source_from;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/pickupmail',{json:{"app_id":app_id,"user_id":user_id,"date":date,"time" :time,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    var desc = "Pickup Mail sent by "+  req.user.email +" Time "+'( ' + time + ' )'+ " /Date " +'( ' + date + ' )'+'( ' + source_from + ' )';
                    var activity = "Pickup Mail sent";
                    functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                    res.json({
                        status:200,
                        message:'Pickup Mail sent Successfully..'
                    })
                }else{
                    res.json({
                        status:400,
                        message:'Error in sending mail'
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/pickupmail',{json:{"app_id":app_id,"user_id":user_id,"date":date,"time" : time,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    var desc = "Pickup Mail sent by "+  req.user.email +" Time "+'( ' + time + ' )'+ " /Date " +'( ' + date + ' )'+'( ' + source_from + ' )';
                    var activity = "Pickup Mail sent";
                    functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                    res.json({
                        status:200,
                        message:'Pickup Mail sent Successfully..'
                    })
                }else{
                    res.json({
                        status:400,
                        message:'Error in sending mail'
                    })
                }
            }
        })
    }else if(source_from == 'gumoi'){
        request.post(MOI_BASE_URL+'/admin/adminDashboard/pending/pickupmail',{json:{"app_id":app_id,"user_id":user_id,"email_admin":req.user.email,"date":date,"time" : time,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    var desc = "Pickup Mail sent by "+  req.user.email +" Time "+'( ' + time + ' )'+ " /Date " +'( ' + date + ' )'+'( ' + source_from + ' )';
                    var activity = "Pickup Mail sent";
                    functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                    res.json({
                        status:200,
                        message:'Pickup Mail sent Successfully..'
                    })
                }else{
                    res.json({
                        status:400,
                        message:'Error in sending mail'
                    })
                }
            }
        })
    }else if(source_from == 'guattestation' ){
        request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/pending/pickupmail',{json:{"app_id":app_id,"user_id":user_id,"email_admin":req.user.email,"date":date,"time" : time,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    var desc = "Pickup Mail sent by "+  req.user.email +" Time "+'( ' + time + ' )'+ " /Date " +'( ' + date + ' )'+'( ' + source_from + ' )';
                    var activity = "Pickup Mail sent";
                    functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                    res.json({
                        status:200,
                        message:'Pickup Mail sent Successfully..'
                    })
                }else{
                    res.json({
                        status:400,
                        message:'Error in sending mail'
                    })
                }
            }
        })
    }
})

router.post('/sentoEdulab',async (req,res,next)=>{
    var user_id = req.body.user_id;
    var app_id = req.body.app_id;
    var source_from = req.body.source_from;

    var updateTracker = await functions.UpdateToPrint(app_id);
    if(updateTracker){
        var desc = "Application Id " + app_id + " Processed from Print to Print to Edulab " + " by "+  req.user.email;
        var activity = "Application Sent To Edulab";
        functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
        res.json({
            status : 200
        })
    }else{
        res.json({
            status : 400
        })
    }
})

router.get('/getApplicationDetailsByUser_wes',getUserRole,  function (req, res) {
    
    var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var source_from = req.query.source_from ? req.query.source_from : '';
    var tracker = req.query.tracker ? req.query.tracker : null;
    var status = req.query.status ? req.query.status : null;
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(id != '' && id != null && id != undefined && id != 'null' && id != 'undefined'){
        var filter ={};
        filter.name = 'application_id';
        filter.value = id;
        filters.push(filter);
    }

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
            filter.name = 'name';
            filter.value = " AND( usr.name like '%" + nameSplit[0] + "%' OR usr.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
            filter.value = " AND usr.name like '%" + nameSplit[0] + "%' AND usr.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
            filter.value = " AND usr.name like '%" + nameSplit.join(' ') + "%' AND usr.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }

    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(source_from != '' && source_from != null && source_from != undefined && source_from != 'null' && source_from != 'undefined'){
        var filter ={};
        filter.name = 'source_from';
        filter.value = source_from;
        filters.push(filter);
	}



   models.Application.getApplicationByUser_count_wes(filters,tracker,status,null,null,req.superRoles,req.attest,req.verify).then(data1 => {
        countObjects.totalLength = data1[0].cnt;
        models.Application.getApplicationByUser_wes(filters,tracker,status,limit,offset,req.superRoles,req.attest,req.verify).then(data => {
            countObjects.filteredLength = data.length;
            require('async').eachSeries(data, function(student, callback){
                students.push({
                    user_id : student.user_id,
                    name :student.name,
                    email : student.email,
                    marksheetName : student.marksheetName,
                    services : student.app_data,
                    source_from : student.source_from,
                    applied_for : student.applied_for,
                    attestedFor : student.attestedfor,
                    previous_data:student.app_data,
                });
                callback();
            }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : students,
                    total_count : countObjects,
                    roles : req.arrayRole
                });
            });
        });
    });
});

router.get('/viewFileStatus',(req,res)=>{
    models.Wes_Records.findAll({
      where:{
        userId:req.query.userid,
        appl_id : req.query.app_id
      },
      attributes:['wesnumber','reference_no','appl_id','userId','fileName','status','updated_at']
    }).then((user)=>{
      if(user){
        res.json({
          status:200,
          data:user
        })
      }
    })
})

router.get('/getApplicationDetailsByUser',getUserRole,  function (req, res) {
    
    var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var name = req.query.name ? req.query.name : '';
    var orderId = req.query.orderId ? req.query.orderId : '';
    var email = req.query.email ? req.query.email : '';
    var source_from = req.query.source_from ? req.query.source_from : '';
    var tracker = req.query.tracker ? req.query.tracker : null;
    var status = req.query.status ? req.query.status : null;
    var emailId = req.user.email ? req.user.email : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(id != '' && id != null && id != undefined && id != 'null' && id != 'undefined'){
        var filter ={};
        filter.name = 'application_id';
        filter.value = id;
        filters.push(filter);
    }

    if(orderId != '' && orderId != null && orderId != undefined && orderId != 'null' && orderId != 'undefined'){
        var filter ={};
        filter.name = 'order_id';
        filter.value = orderId;
        filters.push(filter);
    }

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
            filter.name = 'name';
            filter.value = " AND( usr.name like '%" + nameSplit[0] + "%' OR usr.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
            filter.value = " AND usr.name like '%" + nameSplit[0] + "%' AND usr.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
            filter.value = " AND usr.name like '%" + nameSplit.join(' ') + "%' AND usr.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }

    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(source_from != '' && source_from != null && source_from != undefined && source_from != 'null' && source_from != 'undefined'){
        var filter ={};
        filter.name = 'source_from';
        filter.value = source_from;
        filters.push(filter);
	}



   models.Application.getApplicationByUser_count(filters,tracker,status,null,null,req.superRoles,req.superuniversity,req.attest,req.verify,emailId).then(data1 => {
        countObjects.totalLength = data1[0].cnt;
        models.Application.getApplicationByUser(filters,tracker,status,limit,offset,req.superRoles,req.superuniversity,req.attest,req.verify,emailId).then(async data => {
        countObjects.filteredLength = data.length;

            require('async').eachSeries(data, function(student, callback){
               
                students.push({
                    user_id : student.user_id,
                    name :student.name,
                    email : student.email,
                    marksheetName : student.marksheetName,
                    services : student.app_data,
                    source_from : student.source_from,
                    university : student.university,
                    applied_for : student.applied_for,
                    attestedFor : student.attestedfor,
                    previous_data:student.app_data
                });
                callback();
            }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : students,
                    total_count : countObjects,
                    roles : req.arrayRole
                });
            });
         }).catch(e=>{
        })
    }).catch(e=>{
    })
});

router.get('/checksignedpdf',function (req, res) {
    var userId = req.query.userId;
    var app_id = req.query.id;
    var source_from = req.query.source_from;

    if(source_from == 'guverification'){
        request.get(VERIFY_BASE_URL+'/application/checksignedpdf?id=' + app_id + '&userId=' + userId,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY)
                if(data.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.get(SY_VERIFY_BASE_URL+'/application/checksignedpdf?id=' + app_id + '&userId=' + userId,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY)
                if(data.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guattestation'   || source_from == 'gumoii') {
        request.get(ATTESTATION_BASE_URL+'/admin/adminDashboard/checksignedpdf?user_id=' + userId + '&appl_id='+ app_id,
        function(error, response, VERIFY){
            if(error){
            }else{
               res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
               })
            }
        })
    }else if( source_from == 'gumoi') {
        request.get(MOI_BASE_URL+'/admin/adminDashboard/checksignedpdf?user_id=' + userId + '&appl_id='+ app_id,
        function(error, response, VERIFY){
            if(error){
            }else{
                 res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
              
            }
        })
    }

})

router.get('/student_feeback',function (req, res) {
    models.Feedback.getAllData().then(feedback => {
            res.json({
                status : 200,
                data : feedback
            })
    });

})

router.get('/superview', async function (req, res) {
    var user_id = req.query.userId;
    var category = req.query.category;
    var veriydate;
    var studentObj = {
        personal_info: {},
        pdcedudetail: [],
        convactionedudetail: [],
        userTranscripts: [],
        userTranscriptmigration: [],
        gumigrationedu: [],
        convactiondocs: [],
        marksheetDetails: [],
        transcriptDetails: [],
        degreeDetails: [],
        secondYearDetails :{},
        migrationapplication: []

    };
    let getpreintapplication =await functions.getapplicationprint(user_id);
    var array = ['Photo', 'Sign', 'Transfer Certificate', 'Enrollment Letter', 'Bonafide Letter', 'PRN Status Report', 'SemesterOne', 'SemesterTwo', 'SemesterThree', 'SemesterFour', 'SemesterFive', 'SemesterSix', 'SemesterSeven', 'SemesterEight', 'SemesterNine', 'SemesterTen']
    let userdata = await functions.getuserdetail(user_id);
    studentObj.personal_info.userid = userdata.id,
    studentObj.personal_info.name = userdata.name,
    studentObj.personal_info.surname = userdata.surname,
    studentObj.personal_info.email = userdata.email,
    studentObj.personal_info.mobile_country_code = userdata.mobile_country_code,
    studentObj.personal_info.mobile = userdata.mobile,
    studentObj.personal_info.gender = userdata.gender,
    studentObj.personal_info.city = userdata.city,
    studentObj.personal_info.postal_code = userdata.postal_code,
    studentObj.personal_info.address = userdata.address,
    studentObj.personal_info.what_mobile_country_code = userdata.what_mobile_country_code,
    studentObj.personal_info.what_mobile = userdata.what_mobile,
    studentObj.personal_info.current_location = userdata.current_location
    studentObj.personal_info.dob = userdata.dob

    //To Get PDC Education Data
    let edudetail = await functions.getedudetailpdc(user_id, 'pdc',category)
    studentObj.pdcedudetail.push(...edudetail)
    //To Get Convaction Education Data
    let edudetailconavction = await functions.getedudetailpdc(user_id, 'guconvocation',category)
    studentObj.convactionedudetail.push(...edudetailconavction)
    let docdata = await functions.getdocdetailpdc(user_id, 'pdc',category)
    if (docdata.length > 0) {
        for (let usertranscript of docdata) {
            var imgArr = usertranscript.file_name.split('.');
            var extension = imgArr[imgArr.length - 1].trim();
            var docname
            var app_id = usertranscript.app_id
            var documents
            if (usertranscript.name =='Photo' || usertranscript.name=='Aadhar Card' ) {
                docname = usertranscript.name
            }else{
                docname = usertranscript.applied_for_degree

            }   
            studentObj.userTranscripts.push({
                id: usertranscript.id,
                name: usertranscript.name,
                pdfimage: 'https://cdn.elegantthemes.com/blog/wp-content/uploads/2016/09/wordpress-pdf-icon.png',
                file_name: usertranscript.file_name,
                file: serverUrl + "/upload/documents/" + usertranscript.user_id + "/" + usertranscript.file_name,
                extension: extension,
                source: usertranscript.source,
                userid: usertranscript.user_id,
                docname: docname,
                app_id: app_id,
            });

        }

    }
    //To Get Convaction Document Data Data
    let docdataconvacttion = await functions.getdocdetailpdc(user_id, 'guconvocation',category)
    if (docdataconvacttion.length > 0) {
        for (let usertranscript of docdataconvacttion) {
            var imgArr = usertranscript.file_name.split('.');
            var extension = imgArr[imgArr.length - 1].trim();
            var docname
            var app_id = usertranscript.app_id
            var documents
            if (usertranscript.name == 'YearThird' || usertranscript.name == 'SemesterSix') {
                docname = 'Final Year Marksheet'
            }
            else if (usertranscript.name == 'Photo' || usertranscript.name == 'extra' || usertranscript.name == 'Convaction Fee') {
                docname = usertranscript.name
            }
            studentObj.convactiondocs.push({
                id: usertranscript.id,
                name: usertranscript.name,
                pdfimage: 'https://cdn.elegantthemes.com/blog/wp-content/uploads/2016/09/wordpress-pdf-icon.png',
                file_name: usertranscript.file_name,
                file: serverUrl + "/upload/documents/" + usertranscript.user_id + "/" + usertranscript.file_name,
                extension: extension,
                source: usertranscript.source,
                userid: usertranscript.user_id,
                docname: docname,
                app_id: app_id,

            });

        }
    }
    //To Get Migration Education Data
    let edumigration = await functions.getedumigration(user_id)
    if(edumigration.length>0){
        let Application = await functions.getapplicationmig(user_id, 'gumigration')
        if(Application.length>0){
            edumigration.map((data) => {
                let data22 = { ...data, app_id:Application[0].id,education_lock :Application[0].education_lock,notes:Application[0].notes};
                    studentObj.gumigrationedu.push(data22)
                });
        }else{
            studentObj.gumigrationedu = edumigration;
        }
   
        //To Get Migration Document
        let migrationmarksheet = await functions.getdocdetailmig(user_id, 'gumigration')
        for (let userTranscript of migrationmarksheet) {
            var index = array.indexOf(userTranscript.name);
            if (index !== -1) {
                array.splice(index, 1);
            }
            var imgArr = userTranscript.file_name.split('.');
            var extension = imgArr[imgArr.length - 1].trim();
            studentObj.userTranscriptmigration.push({
                id: userTranscript.id,
                name: userTranscript.name,
                userid: userTranscript.user_id,
                image: "https://gumigration.studentscenter.in/api/" + "upload/documents/" + userTranscript.user_id + '/' + userTranscript.file_name,
                file_name: userTranscript.file_name,
                file_path: '/var/www/' + "public/upload/documents/" + userTranscript.user_id + '/' + userTranscript.file_name,
                timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                transcript_lock: userTranscript.lock_transcript,
                extension: extension,
                type: userTranscript.type
                //collegeName : college.name
            });
        }
    }
  
    //To Get Verifcation Data
    let verification = await functions.getverification(user_id,category)
    if (verification.length > 0) {
        for (let document of verification) {
            var extension = document.file.split('.');
            if (document.type == 'marksheet') {
                studentObj.marksheetDetails.push({
                    id: document.id,
                    userid: document.user_id,
                    app_id: document.app_id,
                    courseName: document.courseName,
                    seatNo: document.seatNo,
                    passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                    collegeName : document.collegeName,
                    result : document.resultClass,
                    semester : document.semester,
                    fileName: document.file,
                    fileSrc: serverUrl + '/upload/documents/' + user_id + '/' + document.file,
                    fileExtension: extension[1],
                    lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                    upload_step: (document.upload_step == 'requested') ? true : false
                })
            } else if (document.type == 'transcript') {
                studentObj.transcriptDetails.push({
                    id: document.id,
                    userid: document.user_id,
                    app_id: document.app_id,
                    courseName: document.courseName,
                    seatNo: document.seatNo,
                    collegeName : document.collegeName,
                    result : document.resultClass,
                    passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                    fileName: document.file,
                    fileSrc: serverUrl + '/upload/documents/' + user_id + '/' + document.file,
                    fileExtension: extension[1],
                    lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                    upload_step: (document.upload_step == 'requested') ? true : false
                })
            } else if (document.type == 'degree') {
                studentObj.degreeDetails.push({
                    id: document.id,
                    courseName: document.courseName,
                    seatNo: document.seatNo,
                    userid: document.user_id,
                    app_id: document.app_id,
                    collegeName : document.collegeName,
                    result : document.resultClass,
                    convocationDate:moment(new Date(document.convocationDate)).format('DD-MM-YYYY'),
                    passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                    fileName: document.file,
                    fileSrc: serverUrl + '/upload/documents/' + user_id + '/' + document.file,
                    fileExtension: extension[1],
                    lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                    upload_step: (document.upload_step == 'requested') ? true : false
                })
            } else if(document.type == 'secondYear'){
                if(document.semester == "Semester III"){
                    studentObj.secondYearDetails.id = document.id;
                    studentObj.secondYearDetails.userid= document.user_id;
                    studentObj.secondYearDetails.collegeName = document.collegeName;
                    studentObj.secondYearDetails.courseName = document.courseName;
                    studentObj.secondYearDetails.passingMonthYear = moment(new Date(document.PassingMonthYear)).format('MMM YYYY');
                    studentObj.secondYearDetails.type = document.type;
                    studentObj.secondYearDetails.fileName = document.file;
                    studentObj.secondYearDetails.fileSrc = serverUrl + '/upload/documents/' + user_id + '/' + document.file;
                    studentObj.secondYearDetails.fileExtension = extension[1];
                    studentObj.secondYearDetails.lock_transcript= (document.lock_transcript == 'requested') ? true : false;  
                    studentObj.secondYearDetails.upload_step= (document.upload_step == 'requested') ? true : false
                    studentObj.secondYearDetails.result = document.resultClass;
                    studentObj. secondYearDetails.semester = document.semester;
                    studentObj. secondYearDetails.majorSubject = document.majorSubject;
                    studentObj.secondYearDetails.subsidarySubject = document.subsidarySubject;
                    studentObj.secondYearDetails.fromMonthYear = moment(new Date(document.enrollmentStart)).format('MMM YYYY');
                    studentObj.secondYearDetails.toMonthYear = moment(new Date(document.enrollmentEnd)).format('MMM YYYY');
                }else  if(document.semester == "Semester IV"){
                    studentObj.secondYearDetails.id2 = document.id;
                    studentObj. secondYearDetails.semester2 = document.semester;
                    studentObj.secondYearDetails.passingMonthYear2 = moment(new Date(document.PassingMonthYear)).format('MMM YYYY');
                    studentObj.secondYearDetails.result2 = document.resultClass;
                    studentObj.secondYearDetails.fileSrc2 = serverUrl + '/upload/documents/' + user_id + '/' + document.file;
                    studentObj.secondYearDetails.fileExtension2 = extension[1];
                    studentObj.secondYearDetails.lock_transcript2= (document.lock_transcript == 'requested') ? true : false;  
                    studentObj.secondYearDetails.upload_step2= (document.upload_step == 'requested') ? true : false
                }else if(document.semester == "Second Year"){
                    studentObj.secondYearDetails.id = document.id;
                    studentObj.secondYearDetails.userid= document.user_id;
                    studentObj.secondYearDetails.collegeName = document.collegeName;
                    studentObj.secondYearDetails.courseName = document.courseName;
                    studentObj.secondYearDetails.semester = document.semester;
                    studentObj.secondYearDetails.passingMonthYear = moment(new Date(document.PassingMonthYear)).format('MMM YYYY');
                    studentObj.secondYearDetails.majorSubject = document.majorSubject;
                    studentObj.secondYearDetails.subsidarySubject = document.subsidarySubject;
                    studentObj.secondYearDetails.fromMonthYear = moment(new Date(document.enrollmentStart)).format('MMM YYYY');
                    studentObj.secondYearDetails.toMonthYear = moment(new Date(document.enrollmentEnd)).format('MMM YYYY');
                    studentObj.secondYearDetails.result = document.resultClass;
                    studentObj.secondYearDetails.type = document.type;
                    studentObj.secondYearDetails.fileName = document.file;
                    studentObj.secondYearDetails.fileSrc = serverUrl + '/upload/documents/' + user_id + '/' + document.file;
                    studentObj.secondYearDetails.fileExtension = extension[1];
                    studentObj.secondYearDetails.lock_transcript= (document.lock_transcript == 'requested') ? true : false;  
                    studentObj.secondYearDetails.upload_step= (document.upload_step == 'requested') ? true : false
                }else{
                    studentObj.secondYearDetails.id3 = document.id;
                    studentObj.secondYearDetails.fileName3 = document.file;
                    studentObj.secondYearDetails.fileSrc3 = serverUrl + '/upload/documents/' + user_id + '/' + document.file;
                    studentObj.secondYearDetails.fileExtension3 = extension[1];
                    studentObj.secondYearDetails.lock_transcript3= (document.lock_transcript == 'requested') ? true : false;  
                    studentObj.secondYearDetails.upload_step3= (document.upload_step == 'requested') ? true : false
                }
            }
        }
    }
    res.json({
        status: 200,
        data: studentObj
    })


});

router.get('/getAdminInstructionalDetails',(req,res)=>{
	var data = [];
	models.InstructionalDetails.findAll(
		{
			where:{
				userId:req.query.userId
			}
		}
	).then(user=>{
		user.forEach(function (userdata){
			data.push({
					name : userdata.studentName,
					course:  userdata.courseName,
					college :userdata.collegeName,
					duration : userdata.duration,
					specialization : userdata.specialization,
					yearofpassing : userdata.yearofpassing,
					division :userdata.division,
					app_id:userdata.app_id
				})
			})
		if(data){
			res.json({
				data :  data
			})
		}else{
			res.json({
			data  : null
			})
		}
	})
})

router.post('/sendEmail', function (req, res) {
    var app_id = req.body.id;
    var type = req.body.type;
    var source_from = req.body.source_from
    var istituteEmails = [];
    var attachments = [];
    var studentData = {};
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	if(source_from == 'guattestation' ){
        request.post(ATTESTATION_BASE_URL+'/signpdf/documentSending',{json:{"appl_id":app_id,"email_admin":req.user.email,"value" :type,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Sent Successfullly..'
                    })
                }else{
                    res.json({
                        status:400,
                        message: VERIFY['message']
                    })
                }
            }
        })
    }else  if(source_from == 'gumoi'){
        request.post(MOI_BASE_URL+'/signpdf/documentSending',{json:{"appl_id":app_id,"email_admin":req.user.email,"value" :type,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Sent Successfullly..'
                    })
                }else{
                    res.json({
                        status:400,
                        message: VERIFY['message']
                    })
                }
            }
        })
    }else if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/sendEmail',{json:{"id":app_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Sent Successfullly..'
                    })
                }else{
                    res.json({
                        status : 400,
                        message : VERIFY.message
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/sendEmail',{json:{"id":app_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Sent Successfullly..'
                    })
                }else{
                    res.json({
                        status : 400,
                        message : VERIFY.message
                    })
                }
            }
        })
    }

})

//Auther Shweta Vaidya
//Get all data from activity tracker tab
router.get('/superactivitytracker', function(req, res) {
	var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var date = req.query.date ? req.query.date : '';
    var email = req.query.email ? req.query.email : '';
    var data = req.query.data ? req.query.data : '';
    var service = req.query.service ? req.query.service : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(data != '' && data != null && data != undefined && data != 'null' && data != 'undefined'){
        var filter ={};
        filter.name = 'data';
        filter.value = data;
        filters.push(filter);
    }

    if(date != '' && date != null && date != undefined && date != 'null' && date != 'undefined' && date!='Invalid date'){
        var filter ={};
        filter.name = 'date';
        filter.value = date;
        filters.push(filter);
    }

    if(service != '' && service != null && service != undefined && service != 'null' && service != 'undefined'){
        var filter ={};
        filter.name = 'source';
        filter.value = service;
        filters.push(filter);
    }




	//Replace adminactivity to studentactivity
    models.Activitytracker.getsuperactivitySearchResults(filters,null,null).then(function(useractivity){
        countObjects.totalLength = useractivity.length;
        models.Activitytracker.getsuperactivitySearchResults(filters,limit,offset).then(function(filter_activity) {
            countObjects.filteredLength = filter_activity.length;
             var acticity_data = [];
                if(filter_activity != null) {
                    require('async').eachSeries(filter_activity, function(student, callback){
                        var obj = {
                            application_id : (student.application_id) ? student.application_id : '',
                            created_at : (student.created_at) ? moment(new Date(student.created_at)).format('DD/MM/YYYY hh:mm') : '',
                            email : (student.username) ? student.username : '',
                            action:(student.action)? student.action:'',
                            data:(student.data)? student.data:'',
                            user_id:(student.userId)? student.userId:'',
                            ipAddress : (student.ipAddress) ? student.ipAddress : "",
                            source_from:(student.source_from)? student.source_from:'',
                        };

                        acticity_data.push(obj);

                        callback();

                    }, function(){
                        res.json({
                            status: 200,
                            message: 'Student retrive successfully',
                            items: acticity_data,
                            total_count: countObjects,
                        });
           });
       } else {
           res.json({
               status: 400,
               message: 'Problem in retrieving student list'
           });
       }
	});
    });

});



router.get('/students', function (req, res){
    var page = req.query.page;
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var year = req.query.acadYear ? req.query.acadYear : '';
    var emailId = req.user.email ? req.user.email : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
             filter.name = 'name';
           filter.value = " AND( user.name like '%" + nameSplit[0] + "%' OR user.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
           filter.value = " AND user.name like '%" + nameSplit[0] + "%' AND user.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
             filter.value = " AND user.name like '%" + nameSplit.join(' ') + "%' AND user.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }

    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(year != '' && year != null && year != undefined && year != 'null' && year != 'undefined'){
        var filter ={};
		var currentyear = year;
		var startdate = currentyear+"-04-01";
		var year = parseInt(currentyear) + 1;
		var enddate = year + "-04-01"  ;
        filter.name = 'application_year';
        filter.value = " AND a.created_at BETWEEN '" + startdate + "' AND '" + enddate + "'";
        filters.push(filter);
    }
    var data = []; var countObj={};
    // fetch total active & inactive student count from db.
    models.User.getAllUsersInfo(filters,null,null,emailId).then(function(studentsData) {
        countObjects.totalLength = studentsData.length;
        models.User.getAllUsersInfo(filters,limit,offset,emailId).then(function(students) {
            countObjects.filteredLength = students.length;

            if(students != null) {
                 require('async').eachSeries(students, function(student, callback){

                    var obj = {
                        id: (student.id) ? student.id : '',
                        name: (student.name) ? student.name : '',
                        surname: (student.surname) ? student.surname : '',
                        email: (student.email) ? student.email : '',
                    };

                    data.push(obj);
                    callback();

                }, function(){
                    res.json({
                        status: 200,
                        message: 'Student retrive successfully',
                        items: data,
                        total_count: countObjects,
                    });
                });
            } else {
                res.json({
                    status: 400,
                    message: 'Problem in retrieving student list'
                });
            }

        })
    })

});

/*Priyanka Divekar
Route : Get all details of the agents
*/
router.get('/getAgentDetails', function (req, res){
    var page = req.query.page;
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        
        filter.name = 'name';
        filter.value = " AND user.marksheetName like '%" + name + "%' ";
        filters.push(filter);
        

    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    
    var data = []; var countObj={};
    // fetch total active & inactive student count from db.
    models.User.getAllAgentInfo(filters,null,null).then(function(studentsData) {
        countObjects.totalLength = studentsData.length;
        models.User.getAllAgentInfo(filters,limit,offset).then(function(students) {
            countObjects.filteredLength = students.length;

            if(students != null) {
                 require('async').eachSeries(students, function(student, callback){

                    var obj = {
                        id: (student.id) ? student.id : '',
                        name: (student.name) ? student.name : '',
                        email: (student.email) ? student.email : '',
                    };

                    data.push(obj);
                    callback();

                }, function(){
                    res.json({
                        status: 200,
                        message: 'Agent retrive successfully',
                        items: data,
                        total_count: countObjects,
                    });
                });
            } else {
                res.json({
                    status: 400,
                    message: 'Problem in retrieving student list'
                });
            }

        })
    })

});

/*Priyanka Divekar
Route : reset password or verify otp of particular agent
*/
router.post('/resetPasswordOtp', function(req, res){
    var type = req.body.type;
    var email = req.body.email;
    models.User.findOne({
        where:{
            email : email
        }
    }).then(function(user){
        if(user){
            if(type == 'password'){
                var {hashPassword} = functions.generateHashPassword('123456')
                user.update({
                    password : hashPassword
                }).then(function(user_updated){
                    if(user_updated){
                        res.json({
                            status : 200,
                            message :'Password changed successfully'
                        })
                    }else{
                        res.json({
                            status : 400,
                            message :'Password not changed'
                        })
                    }
                })
            }else if(type == 'otp'){
                user.update({
                    is_email_verified : true,
                    is_otp_verified : true
                }).then(function(user_updated){
                    if(user_updated){
                        res.json({
                            status : 200,
                            message :'Otp verified successfully'
                        })
                    }else{
                        res.json({
                            status : 400,
                            message :'Otp not verified'
                        })
                    }
                })
            }
        }else{
            res.json({
                status : 400,
                message :'User not found'
            })
        }
    })
})

/*  Author : Priyanka Divekar
Route : Set tracker to verified and status to accept
Paramater : user id and application id  and type as current tab*/

router.post('/setTrackerStatus',  (req,res,next)=>{
    var user_id = req.body.user_id;
    var type = req.body.type;
    var app_id = req.body.id;
    var source_from = req.body.source_from;
    var outward=req.body.outward
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/setVerified',{json:{"app_id":req.body.id,"userId":req.body.user_id,"value":type,"email_admin":req.user.email,"outward":req.body.outward,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }else if(VERIFY.status == 400){
                    res.send({
                        status : 400,
                        message : VERIFY.message
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/setVerified',{json:{"app_id":req.body.id,"userId":req.body.user_id,"value":type,"email_admin":req.user.email,"outward":req.body.outward,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }else if(VERIFY.status == 400){
                    res.send({
                        status : 400,
                        message : VERIFY.message
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation') {
        request.post(CONVOCATION_BASE_URL+'/setVerified',{json:{"app_id":req.body.id,"userId":req.body.user_id,"value":type,"email_admin":req.user.email,"outward":req.body.outward,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'pdc') {
        request.post(PDC_BASE_URL+'/setVerified',{json:{"app_id":req.body.id,"user_id":req.body.user_id,"value":type,"email_admin":req.user.email,"outward":req.body.outward,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gumigration') {
        request.post(MIGRATION_BASE_URL+'/admin/adminDashboard/verification',{json:{"app_id":req.body.id,"user_id":req.body.user_id,"type":'college',"checked" : true,"email_admin":req.user.email,"outward":req.body.outward,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guattestation' ) {
        request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/pending/verifiedBy',{json:{"id":req.body.id,"email_admin":req.user.email,"outward":req.body.outward,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if( source_from == 'gumoi') {
        request.post(MOI_BASE_URL+'/admin/adminDashboard/pending/verifiedBy',{json:{"id":req.body.id,"email_admin":req.user.email,"outward":req.body.outward,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }  else if(source_from == 'guinternship') {
        request.post(intership_BASE_URL+'/setVerified',{json:{"app_id":req.body.id,"user_id":req.body.user_id,"value":type,"email_admin":req.user.email,"outward":req.body.outward,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }
    
})

router.post('/setVerifyforPrint',  (req,res,next)=>{
    var app_id = req.body.app_id;
    var checked = req.body.event;
    var userId = req.body.userId;

     var Verify = functions.verifyforprint(app_id);
     if(Verify){
        var desc = req.user.email + "verified the App id number" + app_id + "for printing from the Printing Tab";
        var activity = "Application Verified for Printing";
        functions.activitylog(req,userId, activity, desc, app_id, 'guAdmin');
        res.json({
            status : 200
        })
     }else{
        res.json({
            status : 400
        })
     }
    
})

router.post('/setApplictaionFormDate',(req,res,next)=>{
    var id = req.body.id   
    var event = req.body.event    
    var user_id = req.body.user_id
    var currentDateTime ;

    if(event == true){
        currentDateTime = req.body.value
    }else{
        currentDateTime = null;
    }
    models.Application.update({
        senttoPrint :  currentDateTime
    },{
        where:{
            id : id
        }
    }).then(function(data){
        if(data){
            var desc = req.user.email + "submitted the documents (Application form for printing)";
            var activity = "Application Form Submitted";
            functions.activitylog(req,user_id, activity, desc, id, 'guAdmin');
            res.json({
                status: 200,
                message : 'Updated Successfully'
            })
        }else{
            res.json({
                status: 400,
                message : 'Error Occured'
            })
        }
    }).catch(e=>{
    })
    
})

router.post('/printSuperAdmin',function(req,res){

    var source_from = req.body.source_from;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if(source_from == "guattestation"){
        request.post(ATTESTATION_BASE_URL+'/signpdf/documentSigning',{json:{"appl_id":req.body.app_id,"type":req.body.type,"degree":'',"email_Admin":req.user.email,"clientIP":clientIP}},
            function(error, response, VERIFY){
                if(error){
                    res.json({
                        status : 400,
                        mess
                    })
                }else{
                    if(VERIFY.status == 200){
                        res.json({
                            status:200,
                            message:'Signed Successfullly..'
                        })
                    }else{
                        res.json({
                            status:400,
                            message: VERIFY.message
                        })
                    }
                }
            })
    }else if(source_from == 'gumoi'){
        request.post(MOI_BASE_URL+'/signpdf/documentSigning',{json:{"appl_id":req.body.app_id,"type":req.body.type,"degree":'',"email_Admin":req.user.email,"clientIP":clientIP}},
            function(error, response, VERIFY){
                if(error){
                    res.json({
                        status : 400,
                        mess
                    })
                }else{
                    if(VERIFY.status == 200){
                        res.json({
                            status:200,
                            message:'Signed Successfullly..'
                        })
                    }else{
                        res.json({
                            status:400,
                            message: VERIFY.message
                        })
                    }
                }
            })
    } else if(source_from == 'gumigration'){
        request.post(MIGRATION_BASE_URL+'/signpdf/migration_certificate',{json:{"appl_id":req.body.app_id,"user_id":req.body.user_id,"data_Values":req.body.dataValues,"email_Admin":req.user.email,"clientIP":clientIP}},
        function(error, response, MIG){
            if(error){
            }else{
                if(MIG.status == 200){
                    res.json({
                        status:200,
                        message:'Signed Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/generateCertificate',{json:{"app_id":req.body.app_id,"userId":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Signed Successfullly..'
                    })
                }else{
                    res.json({
                        status : 400,
                        message: VERIFY.message
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/generateCertificate',{json:{"app_id":req.body.app_id,"userId":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Signed Successfullly..'
                    })
                }else{
                    res.json({
                        status : 400,
                        message: VERIFY.message
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation'){
        request.post(CONVOCATION_BASE_URL+'/generateCertificate',{json:{"app_id":req.body.app_id,"userId":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, body){
            if(error){
            }else{
                if(body.status == 200){
                    res.json({
                        status:200,
                        message:'Signed Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'pdc'){
        request.post(PDC_BASE_URL+'/generateCertificate',{json:{"app_id":req.body.app_id,"userId":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, body){
            if(error){
            }else{
                if(body.status == 200){
                    res.json({
                        status:200,
                        message:'Signed Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guinternship'){
        request.post(intership_BASE_URL+'/generateCertificate',{json:{"app_id":req.body.app_id,"userId":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, body){
            if(error){
            }else{
                if(body.status == 200){
                    res.json({
                        status:200,
                        message:'Signed Successfullly..'
                    })
                }
            }
        })
    }
})
    
/*  Author : Priyanka Divekar
Route : get college wise application count for report
Paramater : source_from as serive*/

router.get('/collegeWiseApplicationCount', function (req, res){
    
    var page = req.query.page;
    var limit = 10;
    var offset = (page - 1) * limit;
    var source_from = req.query.source_from;
    models.Program_List.getCollegeCourse(source_from).then(function(collegeDetails){
        res.json({
            status : 200,
            data : collegeDetails
        })
    });

    
});
    
/*  Author : Priyanka Divekar
Route : get documents for printing the documents
Paramater : application id and user id for getting document of the specified document and source_from  as serive*/

router.get('/printDocuments',function(req,res){
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var source_from = req.query.source_from;
    if(source_from == "guattestation"  ){
        var file_url = ATTESTATION_BASE_URL + '/signedpdf/'+req.query.user_id+ '/'+ req.query.app_id+'_Merge.pdf'
        var file_path = FILE_LOCATION +"public/signedpdf/"+req.query.user_id+'/'+req.query.app_id+'_Merge.pdf'
        if(fs.existsSync(file_path)){
            res.json({
                status : 200,
                data : file_url
            })
        }else{
            
           request.get(ATTESTATION_BASE_URL+'/admin/printDocument?app_id=' + req.query.app_id+ '&user_id='+req.query.user_id + '&clientIP=' + clientIP ,
            function(error, response, VERIFY){
                var data = JSON.parse(VERIFY);
                if(error){
                    res.json({
                        status:400
                    })
                }else{
                        res.json({
                            status:200,
                            data :data.data
                        })
                    }
            })
            
        }
    }else if(source_from == 'gumoi'){
        var file_url = 'https://gumoi.studentscenter.in' + '/api/signedpdf/'+req.query.user_id+ '/'+ req.query.app_id+'_Merge.pdf'
        // var file_url = MOI_BASE_URL + '/signedpdf/'+req.query.user_id+ '/'+ req.query.app_id+'_Merge.pdf'
        var file_path = FILE_LOCATION +"public/signedpdf/"+req.query.user_id+'/'+req.query.app_id+'_Merge.pdf'
        if(fs.existsSync(file_path)){
            res.json({
                status : 200,
                data : file_url
            })
        }else{
            
            request.get(MOI_BASE_URL+'/admin/printDocument?app_id=' + req.query.app_id+ '&user_id='+req.query.user_id + '&clientIP=' + clientIP ,
            function(error, response, VERIFY){
                var data = JSON.parse(VERIFY);
                if(error){
                    res.json({
                        status:400
                    })
                }else{
                        res.json({
                            status:200,
                            data :data.data
                        })
                    }
            })
            
        }
    }else if(source_from == 'gumigration'){
        var file_url = serverUrl+"/upload/transcript/"+req.query.user_id+'/'+req.query.app_id+'_migration_certificate.pdf';
        var file_path = FILE_LOCATION +"public/upload/transcript/"+req.query.user_id+'/'+req.query.app_id+'_migration_certificate.pdf'
        if(fs.existsSync(file_path)){
            res.json({
                status : 200,
                data : file_url
            })
        }else{
            res.json({
                status : 400,
                data : null
            })
        }
    }else if(source_from == 'guverification'){
        request.get(VERIFY_BASE_URL+'/application/getVerificationLetters?id=' + req.query.app_id+ '&userId=' + req.query.user_id + '&email_admin=' + req.user.email + '&clientIP=' + clientIP,
        function(error, response, VERIFY){
            if(error){
                
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.get(SY_VERIFY_BASE_URL+'/application/getVerificationLetters?id=' + req.query.app_id+ '&userId=' + req.query.user_id + '&email_admin=' + req.user.email + '&clientIP=' + clientIP,
        function(error, response, VERIFY){
            if(error){
                
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation'){
        var file_url = 'https://guattestation.studentscenter.in' + "/api/upload/documents/"+req.query.user_id+'/'+req.query.app_id+'_Convocation_Certificate.pdf';
        var file_path = FILE_LOCATION +"public/upload/documents/"+req.query.user_id+'/'+req.query.app_id+'_Convocation_Certificate.pdf'
        if(fs.existsSync(file_path)){
            res.json({
                status : 200,
                data : file_url
            })
        }else{
            res.json({
                status : 400,
                data : null
            })
        }
    }else if(source_from == 'pdc'){
        var file_url = serverUrl+"/upload/documents/"+req.query.user_id+'/'+req.query.app_id+'_Provisional_Certificate.pdf';
        var file_path = FILE_LOCATION +"public/upload/documents/"+req.query.user_id+'/'+req.query.app_id+'_Provisional_Certificate.pdf'
        if(fs.existsSync(file_path)){
            res.json({
                status : 200,
                data : file_url
            })
        }else{
            res.json({
                status : 400,
                data : null
            })
        }
    }
})
    
/*  Author : Priyanka Divekar
Route : get delivery type and mode wise application count for each and ecvery portal
Paramater : N/A*/

router.get('/deliveryTypeModeWiseAppCount', function (req, res){
    var deliveryDetails = {
            attestation : {},
            verification :{},
            migration : {},
            convocation : {},
            pdc :{}
        }

        models.InstituteDetails.getDeliveryTypeModeWiseAppCount('guverification','Digital','Normal').then(function(deliveryTypeModeDetails){
            deliveryDetails.verification.DN =  deliveryTypeModeDetails[0].app_count;
            models.InstituteDetails.getDeliveryTypeModeWiseAppCount('guverification','Digital','Urgent').then(function(deliveryTypeModeDetails){
                deliveryDetails.verification.DU =  deliveryTypeModeDetails[0].app_count;
                models.InstituteDetails.getDeliveryTypeModeWiseAppCount('guverification','Physical','Normal').then(function(deliveryTypeModeDetails){
                    deliveryDetails.verification.PN =  deliveryTypeModeDetails[0].app_count;
                    models.InstituteDetails.getDeliveryTypeModeWiseAppCount('guverification','Physical','Urgent').then(function(deliveryTypeModeDetails){
                        deliveryDetails.verification.PU =  deliveryTypeModeDetails[0].app_count;
                        models.Institution_details.getDeliveryTypeModeWiseAppCount('guattestation','Digital','Normal').then(function(deliveryTypeModeDetails){
                            deliveryDetails.attestation.DN =  deliveryTypeModeDetails[0].app_count;
                            models.Institution_details.getDeliveryTypeModeWiseAppCount('guattestation','Digital','quick').then(function(deliveryTypeModeDetails){
                                deliveryDetails.attestation.DU =  deliveryTypeModeDetails[0].app_count;
                                models.Institution_details.getDeliveryTypeModeWiseAppCount('guattestation','Physical','Normal').then(function(deliveryTypeModeDetails){
                                    deliveryDetails.attestation.PN =  deliveryTypeModeDetails[0].app_count;
                                    models.Institution_details.getDeliveryTypeModeWiseAppCount('guattestation','Physical','quick').then(function(deliveryTypeModeDetails){
                                        deliveryDetails.attestation.PU =  deliveryTypeModeDetails[0].app_count; 
                                        models.Application.getDeliveryTypeModeWiseAppCount('gumigration','Normal').then(function(deliveryTypeModeDetails){
                                            deliveryDetails.migration.PN =  deliveryTypeModeDetails[0].app_count;
                                            models.Application.getDeliveryTypeModeWiseAppCount('gumigration','Quick').then(function(deliveryTypeModeDetails){
                                                deliveryDetails.migration.PU =  deliveryTypeModeDetails[0].app_count; 
                                                models.Application.getDeliveryTypeModeWiseAppCount('guconvocation','Normal').then(function(deliveryTypeModeDetails){
                                                    deliveryDetails.convocation.PN =  deliveryTypeModeDetails[0].app_count;
                                                    models.Application.getDeliveryTypeModeWiseAppCount('guconvocation','Immediate').then(function(deliveryTypeModeDetails){
                                                        deliveryDetails.convocation.PU =  deliveryTypeModeDetails[0].app_count; 
                                                        models.Application.getDeliveryTypeModeWiseAppCount('pdc','Normal').then(function(deliveryTypeModeDetails){
                                                            deliveryDetails.pdc.PN =  deliveryTypeModeDetails[0].app_count;
                                                            models.Application.getDeliveryTypeModeWiseAppCount('pdc','Immediate').then(function(deliveryTypeModeDetails){
                                                                deliveryDetails.pdc.PU =  deliveryTypeModeDetails[0].app_count; 
                                                                deliveryDetails.migration.DN = 'N/A';
                                                                deliveryDetails.migration.DU = 'N/A';
                                                                deliveryDetails.convocation.DN = 'N/A';
                                                                deliveryDetails.convocation.DU = 'N/A';
                                                                deliveryDetails.pdc.DN = 'N/A';
                                                                deliveryDetails.pdc.DU = 'N/A';

                                                                res.json({
                                                                    status : 200,
                                                                    data : deliveryDetails
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        });
        
    
    
});
    
/*  Author : Priyanka Divekar
Route : get student application details (showing services with count of each)
Paramater : page is madetory, student name and email are optional. sudent name and email use for searching particular student data */

router.get('/getStudentDetails', function (req, res) {
    var students = [];
    var page = req.query.page;
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
   var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    models.Application.getStudentReportDetails(filters,null,null).then(data1 => {
        countObjects.totalLength = data1.length;
        models.Application.getStudentReportDetails(filters,limit,offset).then(data => {
            countObjects.filteredLength = data.length;
            require('async').eachSeries(data, function(student, callback){
                students.push({
                    name :student.name,
                    email : student.email,
                    services : student.app_data
                });
                callback();
            }, function(){
                res.json({
                    status: 200,
                    message: 'Student retrive successfully',
                    items : students,
                    total_count : countObjects
                });
            });
        });
    });
});

/*  Author : Priyanka Divekar
Route : get documents for printing the documents
Paramater : application id and user id for getting document of the specified document and source_from  as serive*/

router.post('/printAddress',function(req,res){
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var source_from = req.body.source_from;
    var user_id = req.body.user_id;
    var app_id = req.body.appl_id;
    var section = req.body.section;
    var addressid = req.body.addressid;
    if(source_from == 'gumigration'){
        request.post(MIGRATION_BASE_URL+'/signpdf/printAddress',
        {json:{
            "user_id":user_id, "appl_id": app_id, "section":section,"clientIP": clientIP
        }},
        function(error, response, VERIFY){
            if(error){
                
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'guverification'){
        request.get(VERIFY_BASE_URL+'/application/getInstituteAddress?id=' + app_id+ '&userId=' +user_id + '&email_admin=' + req.user.email + '&section=' + section + "&clientIP=" + clientIP,
        function(error, response, VERIFY){
            if(error){
                
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.get(SY_VERIFY_BASE_URL+'/application/getInstituteAddress?id=' + app_id+ '&userId=' +user_id + '&email_admin=' + req.user.email + '&section=' + section + "&clientIP=" + clientIP,
        function(error, response, VERIFY){
            if(error){
                
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation'){
        request.get(CONVOCATION_BASE_URL+'/getAddressAdmin?id=' + app_id + "&user_id=" + user_id + "&addressid=" + addressid + "&clientIP=" + clientIP,
        function(error, response, VERIFY){
            if(error){
                
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'pdc'){
        request.get(PDC_BASE_URL+'/getAddressAdmin?id=' + app_id + "&user_id=" + user_id + "&addressid=" + addressid+ "&clientIP=" + clientIP,
        function(error, response, VERIFY){
            if(error){
                
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data :data.data
                    })
                }
            }
        })
    }else if(source_from == 'guattestation' ){
   

        request.post(ATTESTATION_BASE_URL+'/admin/printAddress',
        {json:{
            "user_id":user_id, "appl_id": app_id, "section":section,"clientIP": clientIP
        }},
        function(error, response, VERIFY){
            if(error){
                
            }else{
                    res.json({
                        status:200,
                        data :response.body.data
                    })
                }
        })
    }else if( source_from == 'gumoi'){
   

        request.post(MOI_BASE_URL+'/admin/printAddress',
        {json:{
            "user_id":user_id, "appl_id": app_id, "section":section,"clientIP": clientIP
        }},
        function(error, response, VERIFY){
            if(error){
                
            }else{
                    res.json({
                        status:200,
                        data :response.body.data
                    })
                }
        })
    }
})

/* Author :Prathmesh Korgaonkar
    Route : get count of applications for pie chart for each and every portal
    Paramater : N/A
*/

router.get('/pieCharts',getUserRole, function (req, res) {
    models.Application.getPieChart(req.superRoles,req.superuniversity).then(function (count) {
        
        res.json({
            data: count,
            role : req.superRoles
        })
    })
});

//Auther Shweta Vaidya
//Get Super Admin role wise tab access
router.get('/role_management/getSuperMenuRole',function(req,res) {
  
    var featurenames = [];
	models.Super_Role.findOne({
		where: {
			userid: req.query.userID
		}
	}).then(function (roles) {
		if (roles) {
            if(roles.superrolemanagement){
                featurenames.push('rolemanagement');
            }
			if (roles.superDashboard) {
				featurenames.push('superDashboard');
			}
			if (roles.superStudentManagement) {
				featurenames.push('superStudentManagement');
			}
			if (roles.supercollegeManagement) {
				featurenames.push('supercollegeManagement');
			}
			if (roles.supertotalapplication) {
				featurenames.push('supertotalapplication');
			}
			if (roles.superPending) {
				featurenames.push('superPending');
			}
			if (roles.superVerified) {
				featurenames.push('superVerified');
			}
			if (roles.superSigned) {
				featurenames.push('superSigned');
			}
			if (roles.superPrint) {
				featurenames.push('superPrint');
			}
			if (roles.printedulab) {
				featurenames.push('superPrintbyEdulab');
			}
			if (roles.superWesApp) {
                featurenames.push('superSentWes');
            }
			if (roles.superSent) {
				featurenames.push('superSent');
			}
			if (roles.superPayment) {
				featurenames.push('superPayment');
			}
			if (roles.superReport) {
				featurenames.push('superReport');
			}
            if (roles.superfeedback) {	
				featurenames.push('superfeedback');	
			}
            if (roles.help) {	
				featurenames.push('help');
			}
            if(roles.superFileManagement){
                featurenames.push('superFileManagement');  
            }
            console.log('featurenames' , featurenames)
			res.json({
				status: 200,
				data: featurenames
			})
		} else {
			res.json({
				status: 400
			})
		}
	})
})

router.get('/role_management/getMenuRole',function(req,res) {
  
    var featurenames = [];
	models.Role.findOne({
		where: {
			userid: req.query.userID
		}
	}).then(function (roles) {
		if (roles) {
			if (roles.AdminDash) {
				featurenames.push('AdminDash');
			}
			if (roles.profile) {
				featurenames.push('profile');
			}
			if (roles.studentManagement) {
				featurenames.push('studentManagement');
			}
			if (roles.collegeManagement) {
				featurenames.push('collegeManagement');
			}
			if (roles.adminTotal) {
				featurenames.push('adminTotal');
			}
			if (roles.adminPending) {
				featurenames.push('adminPending');
			}
			if (roles.adminVerified) {
				featurenames.push('adminVerified');
			}
			if (roles.adminSigned) {
				featurenames.push('adminSigned');
			}
			if (roles.adminPrint) {
				featurenames.push('adminPrint');
			}
			if (roles.adminWesApp) {
				featurenames.push('adminWesApp');
			}
			if (roles.adminemailed) {
				featurenames.push('adminemailed');
			}
			if (roles.adminPayment) {
				featurenames.push('adminPayment');
			}
			if (roles.adminReport) {
				featurenames.push('adminReport');
			}
            if (roles.studentfeedback) {	
				featurenames.push('studentfeedback');	
			}
            if (roles.help) {	
				featurenames.push('help');	
			}
            if (roles.fileManagement) {   
                featurenames.push('fileManagement');  
            }
			res.json({
				status: 200,
				data: featurenames
			})
		} else {
			res.json({
				status: 400
			})
		}
	})
})

router.get('/role_management/main', function(req, res) {
    var counter = 0;
    var name = (req.query.name != 'undefined') ? req.query.name : '';
    var email = (req.query.email != 'undefined') ? req.query.email : '';

    models.User.findAll({
        where: {
            user_type: 'subAdmin',
            name : {
				[Op.like] : '%'+name+'%'
			},
            email : {
				[Op.like] : '%'+email+'%'
			}
        },
        attributes: ['id','name','email','mobile','user_status'],
        include: [
            {
                model: models.Role,
                attributes: ['AdminDash','studentManagement','collegeManagement','adminTotal','adminPending','adminVerified','adminSigned','adminPrint','adminWesApp','adminemailed','adminPayment','adminReport','studentfeedback','help','source','fileManagement','marksheet', 'transcript', 'degree', 'thesis', 'moi']
            },
            {
				model: models.Super_Role,
				attributes: ['superDashboard','superStudentManagement','supercollegeManagement','supertotalapplication','superPending','superVerified','superSigned','superPrint','superWesApp','superSent','superPayment','superReport','superfeedback','help','source','activity','superFileManagement','marksheet', 'transcript', 'degree', 'thesis', 'moi']
			}
        ],
    }).then(function(subadmins){
        var features = [];
        var subfeaturenames = [];
        var subAdminsFinal = [];
        for(var i=0; i < subadmins.length; i++){
            counter++;
            var features = [];
            var subfeaturenames = [];
            var superfeaturenames = [];
            var supersource = [];
            if(subadmins[i].Role != null){
                for (var key in subadmins[i].Role.dataValues){
                    if(subadmins[i].Role.dataValues[key]){
                       
                        features.push(key);
                        if(key == 'AdminDash'){
                            if(subfeaturenames.indexOf("AdminDash") == -1){
                                subfeaturenames.push('AdminDash');
                            }
                        }else if(key == 'profile'){
                            if(subfeaturenames.indexOf("profile") == -1){
                                subfeaturenames.push('profile');
                            }
                        }else if(key == 'studentManagement'){
                            if(subfeaturenames.indexOf("studentManagement") == -1){
                                subfeaturenames.push('studentManagement');
                            }
                        }else if(key == 'collegeManagement'){
                            if(subfeaturenames.indexOf("collegeManagement") == -1){
                                subfeaturenames.push('collegeManagement');
                            }	
                        }else if(key == 'adminTotal'){
                            if(subfeaturenames.indexOf("adminTotal") == -1){
                                subfeaturenames.push('adminTotal');
                            }
                        }else if(key == 'adminPending'){
                            if(subfeaturenames.indexOf("adminPending") == -1){
                                subfeaturenames.push('adminPending');
                            }
                        }else if(key == 'adminVerified'){
                            if(subfeaturenames.indexOf("adminVerified") == -1){
                                subfeaturenames.push('adminVerified');
                            }
                        }else if(key == 'adminSigned'){
                            if(subfeaturenames.indexOf("adminSigned") == -1){
                                subfeaturenames.push('adminSigned');
                            }
                        }else if(key == 'adminPrint'){
                            if(subfeaturenames.indexOf("adminPrint") == -1){
                                subfeaturenames.push('adminPrint');
                            }
                        }else if(key == 'adminWesApp'){
                            if(subfeaturenames.indexOf("adminWesApp") == -1){
                                subfeaturenames.push('adminWesApp');
                            }
                        }else if(key == 'adminemailed'){
                            if(subfeaturenames.indexOf("adminemailed") == -1){
                                subfeaturenames.push('adminemailed');
                            }
                        }else if(key == 'adminPayment'){
                            if(subfeaturenames.indexOf("adminPayment") == -1){
                                subfeaturenames.push('adminPayment');
                            }
                        }else if(key == 'adminReport'){
                            if(subfeaturenames.indexOf("adminReport") == -1){
                                subfeaturenames.push('adminReport');
                            }
                        }else if(key == 'studentfeedback'){
                            if(subfeaturenames.indexOf("studentfeedback") == -1){
                                subfeaturenames.push('studentfeedback');
                            }
                        }else if(key == 'help'){
                            if(subfeaturenames.indexOf("help") == -1){
                                subfeaturenames.push('help');
                            }
                        }else if(key == 'fileManagement'){
                            if(subfeaturenames.indexOf("fileManagement") == -1){
                                subfeaturenames.push('fileManagement');
                            }
                        }else if(key == 'marksheet'){
                            if(subfeaturenames.indexOf('marksheet') == -1){
                                subfeaturenames.push('marksheet');
                            }
                        }else if(key == 'transcript'){
                            if(subfeaturenames.indexOf('transcript') == -1){
                                subfeaturenames.push('transcript');
                            }
                        }else if(key == 'degree'){
                            if(subfeaturenames.indexOf("degree") == -1){
                                subfeaturenames.push('degree');
                            }
                        }else if(key == 'thesis'){
                            if(subfeaturenames.indexOf("thesis") == -1){
                                subfeaturenames.push('thesis');
                            }
                        }else if(key == 'moi'){
                            if(subfeaturenames.indexOf("moi") == -1){
                                subfeaturenames.push('moi');
                            }
                        }
                    }
                }
            }

            if(subadmins[i].Super_Role != null){
                for (var key in subadmins[i].Super_Role.dataValues){
                    if(subadmins[i].Super_Role.dataValues[key]){
                       
                        features.push(key);
                        if(key == 'superDashboard'){
                            if(superfeaturenames.indexOf("superDashboard") == -1){
                                superfeaturenames.push('superDashboard');
                            }
                        }else if(key == 'superStudentManagement'){
                            if(superfeaturenames.indexOf("superStudentManagement") == -1){
                                superfeaturenames.push('superStudentManagement');
                            }
                        }else if(key == 'supercollegeManagement'){
                            if(superfeaturenames.indexOf("supercollegeManagement") == -1){
                                superfeaturenames.push('supercollegeManagement');
                            }
                        }else if(key == 'supertotalapplication'){
                            if(superfeaturenames.indexOf("supertotalapplication") == -1){
                                superfeaturenames.push('supertotalapplication');
                            }	
                        }else if(key == 'superPending'){
                            if(superfeaturenames.indexOf("superPending") == -1){
                                superfeaturenames.push('superPending');
                            }
                        }else if(key == 'superVerified'){
                            if(superfeaturenames.indexOf("superVerified") == -1){
                                superfeaturenames.push('superVerified');
                            }
                        }else if(key == 'superSigned'){
                            if(superfeaturenames.indexOf("superSigned") == -1){
                                superfeaturenames.push('superSigned');
                            }
                        }else if(key == 'superPrint'){
                            if(superfeaturenames.indexOf("superPrint") == -1){
                                superfeaturenames.push('superPrint');
                            }
                        }else if(key == 'superWesApp'){
                            if(superfeaturenames.indexOf("superWesApp") == -1){
                                superfeaturenames.push('superWesApp');
                            }
                        }else if(key == 'superSent'){
                            if(superfeaturenames.indexOf("superSent") == -1){
                                superfeaturenames.push('superSent');
                            }
                        }else if(key == 'superPayment'){
                            if(superfeaturenames.indexOf("superPayment") == -1){
                                superfeaturenames.push('superPayment');
                            }
                        }else if(key == 'superReport'){
                            if(superfeaturenames.indexOf("superReport") == -1){
                                superfeaturenames.push('superReport');
                            }
                        }else if(key == 'superfeedback'){
                            if(superfeaturenames.indexOf("superfeedback") == -1){
                                superfeaturenames.push('superfeedback');
                            }
                        }else if(key == 'help'){
                            if(superfeaturenames.indexOf("help") == -1){
                                superfeaturenames.push('help');
                            }
                        }else if(key == 'superFileManagement'){
                            if(superfeaturenames.indexOf("superFileManagement") == -1){
                                superfeaturenames.push('superFileManagement');
                            }
                        }else if(key == 'marksheet'){
                            if(superfeaturenames.indexOf('marksheet') == -1){
                                superfeaturenames.push('marksheet');
                            }
                        }else if(key == 'transcript'){
                            if(superfeaturenames.indexOf('transcript') == -1){
                                superfeaturenames.push('transcript');
                            }
                        }else if(key == 'degree'){
                            if(superfeaturenames.indexOf("degree") == -1){
                                superfeaturenames.push('degree');
                            }
                        }else if(key == 'thesis'){
                            if(superfeaturenames.indexOf("thesis") == -1){
                                superfeaturenames.push('thesis');
                            }
                        }else if(key == 'moi'){
                            if(superfeaturenames.indexOf("moi") == -1){
                                superfeaturenames.push('moi');
                            }
                        }
                    }
                }
            }

            if(subadmins[i].Super_Role != null){
                for (var key in subadmins[i].Super_Role.dataValues['source']){
                    supersource.push(subadmins[i].Super_Role.dataValues['source'][key].resource)
                }
            }

            subadmins[i].Role = '';
            var subAdminsFinalObj = {};
            subAdminsFinalObj.subadmins = {};
            subAdminsFinalObj.subadmins.id = subadmins[i].id;
            subAdminsFinalObj.subadmins.name = subadmins[i].name;
            subAdminsFinalObj.subadmins.email = subadmins[i].email;
            subAdminsFinalObj.subadmins.mobile = subadmins[i].mobile;
            subAdminsFinalObj.subadmins.user_status = subadmins[i].user_status;
            subAdminsFinalObj.subadmins.features = features;
            subAdminsFinalObj.subadmins.source = supersource;
            subAdminsFinalObj.subadmins.activity = subadmins[i].Super_Role ? subadmins[i].Super_Role.dataValues['activity'] : 'deactivate';
            subAdminsFinalObj.subadmins.subfeaturenames = subfeaturenames;
            subAdminsFinalObj.subadmins.superfeaturenames = superfeaturenames;
            subAdminsFinal.push(subAdminsFinalObj);
            
            if(subadmins.length == counter){
                res.json({
                    status: 200,
                    message: 'Sub-admin list retrieved successfully',
                    data: subAdminsFinal,
                });
            }
        }
    });
        
});

router.post('/role_management/setUpdateRole',function(req,res){
    console.log('setUpdateRole' , req.body);
    let admin = req.body.adminrole;
    // if(admin == 'superAdmin'){
        try{
            models.Super_Role.findOne({
                where:{
                    userid : req.body.user_id
                }
            }).then(function(superroles){
                console.log('superrolessuperroles' , superroles)
                if(superroles){
                    var insert_super_obj = {
                        superDashboard: 0,
                        superStudentManagement: 0,
                        supercollegeManagement: 0,
                        supertotalapplication: 0,
                        superPending: 0,
                        superVerified: 0,
                        superSigned: 0,
                        superPrint: 0,
                        superWesApp: 0,
                        superSent: 0,
                        superPayment: 0,
                        superReport: 0,
                        superfeedback : 0,
                        help: 1,
                        superFileManagement : 0,
                        marksheet : 0,
                        transcript : 0,
                        degree : 0,
                        thesis : 0,
                        moi : 0,
                        printedulab: 0,
                    };
    
                    if(req.body.roles.constructor === Array && req.body.roles.length > 0) {
                        req.body.roles.forEach(function(role) {
                            insert_super_obj[role] = 1;
                        });
                    }
    
                    superroles.update(insert_super_obj).then(function(updated_super_roles){
                        if(updated_super_roles){
                            updated_super_roles.update({
                                source : req.body.source_array,
                                activity : req.body.activity,
                                university : req.body.university
                            })
                        }
                    })
                }else{
                    var insert_super_obj = {
                        userid: req.body.user_id
                    };
    
                    if(req.body.roles){
                        if(req.body.roles.constructor === Array && req.body.roles.length > 0) {
                            req.body.roles.forEach(function(role) {
                                insert_super_obj[role] = 1;
                            });
                        }
                    }
                    console.log('insert_super_objinsert_super_obj' , insert_super_obj)
                    models.Super_Role.create(insert_super_obj).then(function(roles_created) {
                        roles_created.update({
                            source : req.body.source_array,
                            activity : req.body.activity,
                            university : req.body.university
                        })
                    })
                }  
            })
        }catch(err){
                console.log('eeeeeeeeeeeeee' , err)
        }
       
    // }


    // if(admin == 'subAdmin'){
    //     models.Role.findOne({
    //         where:{
    //             userid : req.body.user_id
    //         }
    //     }).then(function(roles){
    //         if(roles){
    //             var insert_obj = {
    //                 AdminDash: 0,
    //                 studentManagement: 0,
    //                 collegeManagement: 0,
    //                 adminTotal: 0,
    //                 adminPending: 0,
    //                 adminVerified: 0,
    //                 adminSigned: 0,
    //                 adminPrint: 0,
    //                 printedulab: 0,
    //                 adminWesApp: 0,
    //                 adminemailed: 0,
    //                 adminPayment: 0,
    //                 adminReport: 0,
    //                 studentfeedback : 0,
    //                 help: 1,
    //                 fileManagement : 0,
    //                 marksheet : 0,
    //                 transcript : 0,
    //                 degree : 0,
    //                 thesis : 0,
    //                 moi : 0,
    //             };
            
    //             if(req.body.roles.constructor === Array && req.body.roles.length > 0) {
    //                 req.body.roles.forEach(function(role) {
    //                     insert_obj[role] = 1;
    //                 });
    //             }

    //             roles.update(insert_obj).then(function(updated_roles) {
    //                 if(updated_roles) {
    //                     updated_roles.update({
    //                         source : req.body.source_array,
    //                         university : req.body.university
    //                     })
    //                     res.json({
    //                         status: 200,
    //                         data:updated_roles
    //                     });
    //                 }else {
    //                     res.json({
    //                         status: 400,
    //                         message : "Error occured while updating roles."
    //                     });
    //                 }
    //             });

    //         }else{
    //             var insert_obj = {
    //                 userid: req.body.user_id,
    //             };

    //             if(req.body.roles){
    //                 if(req.body.roles.constructor === Array && req.body.roles.length > 0) {
    //                     req.body.roles.forEach(function(role) {
    //                         insert_obj[role] = 1;
    //                     });
    //                 }
    //             }

    //             models.Role.create(insert_obj).then(function(roles_created) {
    //                 if(roles_created){
    //                     roles_created.update({
    //                         source : req.body.source_array,
    //                         university : req.body.university
    //                     })
    //                     res.json({
    //                         status:200,
    //                         data:roles_created
    //                     })
    //                 }else{
    //                     res.json({
    //                         status:400,
    //                         message : "Error occured while creating roles."
    //                     })
    //                 }
    //             })
    //         } 
    //     })
    // }

    // models.Role.findOne({
    //     where:{
    //         userid : req.body.user_id
    //     }
    // }).then(function(roles){
    //     models.Super_Role.findOne({
    //         where:{
    //             userid : req.body.user_id
    //         }
    //     }).then(function(superroles){
    //         if(roles){
    //             var insert_obj = {
    //                 AdminDash: 0,
    //                 studentManagement: 0,
    //                 collegeManagement: 0,
    //                 adminTotal: 0,
    //                 adminPending: 0,
    //                 adminVerified: 0,
    //                 adminSigned: 0,
    //                 adminPrint: 0,
    //                 printedulab: 0,
    //                 adminWesApp: 0,
    //                 adminemailed: 0,
    //                 adminPayment: 0,
    //                 adminReport: 0,
    //                 studentfeedback : 0,
    //                 help: 1,
    //                 fileManagement : 0,
    //                 marksheet : 0,
    //                 transcript : 0,
    //                 degree : 0,
    //                 thesis : 0,
    //                 moi : 0,
    //             };
            
    //             if(req.body.roles.constructor === Array && req.body.roles.length > 0) {
    //                 req.body.roles.forEach(function(role) {
    //                     insert_obj[role] = 1;
    //                 });
    //             }

    //             roles.update(insert_obj).then(function(updated_roles) {
    //                 if(updated_roles) {
    //                     updated_roles.update({
    //                         source : req.body.source_array,
    //                     })
    //                     res.json({
    //                         status: 200,
    //                         data:updated_roles
    //                     });
    //                 }else {
    //                     res.json({
    //                         status: 400,
    //                         message : "Error occured while updating roles."
    //                     });
    //                 }
    //             });

    //         }else{
    //             var insert_obj = {
    //                 userid: req.body.user_id,
    //             };

    //             if(req.body.roles){
    //                 if(req.body.roles.constructor === Array && req.body.roles.length > 0) {
    //                     req.body.roles.forEach(function(role) {
    //                         insert_obj[role] = 1;
    //                     });
    //                 }
    //             }

    //             models.Role.create(insert_obj).then(function(roles_created) {
    //                 if(roles_created){
    //                     roles_created.update({
    //                         source : req.body.source_array,
    //                     })
    //                     res.json({
    //                         status:200,
    //                         data:roles_created
    //                     })
    //                 }else{
    //                     res.json({
    //                         status:400,
    //                         message : "Error occured while creating roles."
    //                     })
    //                 }
    //             })
    //         }

    //         if(superroles){
    //             var insert_super_obj = {
    //                 superDashboard: 0,
    //                 superStudentManagement: 0,
    //                 supercollegeManagement: 0,
    //                 supertotalapplication: 0,
    //                 superPending: 0,
    //                 superVerified: 0,
    //                 superSigned: 0,
    //                 superPrint: 0,
    //                 superWesApp: 0,
    //                 superSent: 0,
    //                 superPayment: 0,
    //                 superReport: 0,
    //                 superfeedback : 0,
    //                 help: 1,
    //                 superFileManagement : 0,
    //                 marksheet : 0,
    //                 transcript : 0,
    //                 degree : 0,
    //                 thesis : 0,
    //                 moi : 0,
    //                 printedulab: 0,
    //             };

    //             if(req.body.superroles.constructor === Array && req.body.superroles.length > 0) {
    //                 req.body.superroles.forEach(function(role) {
    //                     insert_super_obj[role] = 1;
    //                 });
    //             }

    //             superroles.update(insert_super_obj).then(function(updated_super_roles){
    //                 if(updated_super_roles){
    //                     updated_super_roles.update({
    //                         source : req.body.source_array,
    //                         activity : req.body.activity,
    //                     })
    //                 }
    //             })
    //         }else{
    //             var insert_super_obj = {
    //                 userid: req.body.user_id
    //             };

    //             if(req.body.superroles){
    //                 if(req.body.superroles.constructor === Array && req.body.superroles.length > 0) {
    //                     req.body.superroles.forEach(function(role) {
    //                         insert_super_obj[role] = 1;
    //                     });
    //                 }
    //             }
    //             models.Super_Role.create(insert_super_obj).then(function(roles_created) {
    //                 roles_created.update({
    //                     source : req.body.source_array,
    //                     activity : req.body.activity,
    //                 })
    //             })
    //         }
    //     })
    // })
})

router.get('/role_management/getRolesData',function (req, res) {
    var view_data = {
        source_array : [],
        aSourChecked : false,
        bSourChecked : false,
        cSourChecked : false,
        dSourChecked : false,
        eSourChecked : false,
        fSourChecked : false,
        gSourChecked : false,
        hSourChecked : false,
        iSourChecked : false,
    };
    models.Role.findOne({
        where:{
            userid : req.query.userId
        }
    }).then(function(roles){
        models.Super_Role.findOne({
            where:{
                userid : req.query.userId
            }
        }).then(function(superroles){
            if(roles){
                if(superroles){
                    superroles.source.forEach(function(sour){
                        view_data.source_array.push(sour.resource);
                        if(sour.resource == 'guattestation'){
                            view_data.aSourChecked = true; 
                        }else if(sour.resource == 'gumigration'){
                            view_data.bSourChecked = true;
                        }else if(sour.resource == 'guconvocation'){
                            view_data.cSourChecked = true;
                        }else if(sour.resource == 'guverification'){
                            view_data.dSourChecked = true;
                        }else if(sour.resource == 'pdc'){
                            view_data.eSourChecked = true;
                        }else if(sour.resource == 'guinternship'){
                            view_data.fSourChecked = true;
                        }else if(sour.resource == 'gumoi'){
                            view_data.gSourChecked = true;
                        }else if(sour.resource == 'gusyverification'){
                            view_data.hSourChecked = true;
                        }else if(sour.resource == 'gupec'){
                            view_data.iSourChecked = true;
                        }
                    })
                }
                
                view_data.AdminDash= roles.AdminDash;
                view_data.profile = roles.profile;
                view_data.studentManagement = roles.studentManagement;
                view_data.collegeManagement = roles.collegeManagement;
                view_data.adminTotal = roles.adminTotal;
                view_data.adminPending = roles.adminPending;
                view_data.adminVerified = roles.adminVerified;
                view_data.adminSigned = roles.adminSigned;
                view_data.adminPrint = roles.adminPrint;
                view_data.adminWesApp = roles.adminWesApp;
                view_data.adminemailed = roles.adminemailed;
                view_data.adminPayment = roles.adminPayment;
                view_data.adminReport = roles.adminReport;
                view_data.studentfeedback = roles.studentfeedback;
                view_data.help = roles.help;
                view_data.fileManagement = roles.fileManagement;
                view_data.marksheet = roles.marksheet;
                view_data.transcript = roles.transcript;
                view_data.degree = roles.degree;
                view_data.thesis = roles.thesis;
                view_data.moi = roles.moi;
                view_data.printedulab = roles.printedulab;
                res.json({
                    status:200,
                    data : view_data,
                    superroles : superroles
                })
    
            }else{
                res.json({
                    status:400
                })
            }
        })
    })
})

router.get('/role_management/getSubAdminData', function(req, res) {
    models.User.findOne({
        where:{
            id : req.query.userId
        }
    }).then(function(user){
        res.json({
            status : 200,
            data : user
        })
    })
});

router.post('/role_management/addUpdatesubAdmin',function(req,res){
    var data  = req.body.subAdminData;
    if(req.body.userId != null){
        models.User.findOne({
            where :{
                id : req.body.userId
            }
        }).then(function(user){
            user.update({
                name : data.name,
                surname : data.surname,
                email : data.email,
                mobile : data.mobile,
                gender : data.gender
            }).then(function(updatedUser){
                var response = {
                    status : 'edit',
                    id : updatedUser.id
                }
                res.json({
                    status : 200,
                    data : response
                })
            })
        })
    }else{
        var password = "123456";
        const { hashPassword } = cipher.generateHashPassword(password);
        const { randomString } = cipher.generateRandomString(6, 'numeric');
        models.User.create({
            name : data.name,
            surname : data.surname,
            email : data.email,
            mobile_country_code : '91',
            mobile : data.mobile,
            gender : data.gender,
            password : hashPassword,
            user_status : 'active',
            user_type : 'subadmin',
            postal_code:'',
            otp : randomString,
            is_otp_verified : 1,
            is_email_verified : 0
        }).then(function(user){
            var response = {
                status : 'add',
                id : user.id
            }
            res.json({
                status : 200,
                data : response
            })
        })
    }
})

router.post('/role_management/changeSubAdminStatus',function(req,res){
    models.User.findOne({
        where :{
            id : req.body.userId
        }
    }).then(function(user){
        if(user.user_status == 'active'){
            user.update({
                user_status : 'inactive'
            }).then(function(updatedUser){
                if(updatedUser){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        status : 400
                    })
                }
            })
        }else if(user.user_status == 'inactive'){
            user.update({
                user_status : 'active'
            }).then(function(updatedUser){
                if(updatedUser){
                    res.json({
                        status : 200
                    })
                }else{
                    res.json({
                        status : 400
                    })
                }
            })
        }

    })
})

router.get('/appWiseDocssuper', async function(req, res) {
    var userId = req.query.userId;
    var category=req.query.category
    var status ='' ;
    var tracker = '';
    var studentObj = {
       userMarkLists:[],
       userTranscripts: [],
       userCurriculums:[],
       userExtraDocument :[],
       letters :[],
       usercompetencys:[],
       letterfornamechange:[]
    };
    if(category != 'studentManagement'){
        switch(category){
            case 'new':{
                status = category;
                tracker = 'apply';
            }
            break;
            case 'requested':{
                status = category;
                tracker = 'apply';
            }
            break;
            case 'changed':{
                status = category;
                tracker = 'apply';
            }
            break;
            case 'reject':{
                status = category;
                tracker = 'apply';
            }
            break;
            case 'verified':{
                status = 'accept';
                tracker = category;
            }
            break;
            case 'signed':{
                status = 'accept';
                tracker = category;
            }
            break;
            case 'print':{
                status = 'accept';
                tracker = category;
            }
            break;
            case 'done':{
                status = 'accept';
                tracker = category;
            }
            break;
        case 'total':{
                status = '';
                tracker = '';
            }
            break;
        }
        let Application = await functions.getapplication(userId,status,tracker, 'guattestation')
            if(Application.length>0){
                for (let application of Application ){
                    let userTranscripts= await functions.userTranscriptdata(application.user_id)
                    if(userTranscripts && userTranscripts.length > 0) {
                        userTranscripts.forEach(function(userTranscript) {
                            if(userTranscript.type.includes('transcripts')){
                                var app_ids= [];
                                if(userTranscript.app_id != undefined || userTranscript.app_id != null){
                                    app_ids  = userTranscript.app_id.split(',');
                                }
                                for(var i=0;i<app_ids.length;i++){
                                    if(application.id == app_ids[i]){
                                        var imgArr = userTranscript.file_name.split('.');
                                        var extension = imgArr[imgArr.length - 1].trim();
                                        var convo_notApproved = false;	
                                        var convo_approved = false;	
                                        var degreeCertificate = false;	
                                        if(Application.notes){	
                                            if(Application.notes.includes(`In place of ${userTranscript.name} you have uploaded degree certificate.`)){	
                                                degreeCertificate = true;         	
                                            }	
                                            if(Application.notes.includes(`${userTranscript.name} is not approved.`)){	
                                                convo_notApproved = true;	
                                            }	
                                            if(Application.notes.includes(`${userTranscript.name} is approved.`)){	
                                                convo_approved = true;	
                                            }	
                                        }
                                        if(userTranscript.collegeId != 0 && userTranscript.collegeId != null){
                                            models.College.findAll({
                                                where:{
                                                    id : userTranscript.collegeId
                                                }
                                            }).then(function(college){
                                                studentObj.userTranscripts.push({
                                                    id: userTranscript.id,
                                                    name: userTranscript.name,
                                                    user_id: userTranscript.user_id,
                                                    image: serverUrl+"/upload/documents/"+userId+'/'+userTranscript.file_name,
                                                    file_name: userTranscript.file_name,
                                                    file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+userTranscript.file_name,
                                                    timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                    updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                    transcript_lock: userTranscript.lock_transcript,
                                                    extension :extension,
                                                    // email : user.email,
                                                    collegeName : college.name,	
                                                    convo_notApproved : convo_notApproved,	
                                                    convo_approved :convo_approved,	
                                                    degreeCertificate : degreeCertificate,
                                                    app_id:application.id 
                                                });
                                            });
                                        }else{
                                            studentObj.userTranscripts.push({
                                                id: userTranscript.id,
                                                name: userTranscript.name,
                                                user_id: userTranscript.user_id,
                                                image: serverUrl+"/upload/documents/"+userId+'/'+userTranscript.file_name,
                                                file_name: userTranscript.file_name,
                                                file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+userTranscript.file_name,
                                                timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                transcript_lock: userTranscript.lock_transcript,
                                                extension :extension,
                                                email : user.email,
                                                collegeName : '',	
                                                convo_notApproved : convo_notApproved,	
                                                convo_approved :convo_approved,	
                                                degreeCertificate : degreeCertificate,
                                                app_id:application.id 
                                            });
                                        }
                                    }
                                }
                            }else{
                                studentObj.userExtraDocument.push({
                                    id: userTranscript.id,
                                    name: userTranscript.name,
                                    user_id: userTranscript.user_id,
                                    image: serverUrl+"/upload/documents/"+userId+'/'+userTranscript.file_name,
                                    file_name: userTranscript.file_name,
                                    file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+userTranscript.file_name,
                                    timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                    updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                    transcript_lock: userTranscript.lock_transcript,
                                    extension :extension,
                                    app_id:application.id,
                                    //email : user.email
                                });
                            }
                        });
                    }
                    let userMarkLists= await functions.userMarkList(application.user_id)
                    if(userMarkLists!=undefined || userMarkLists!='' || userMarkLists!='null' || userMarkLists!=null){
                        models.UserMarklist_Upload.getMarksheetData(userMarkLists[0].user_id).then(function(marklistData){
                            marklistData.forEach(function(allMarklistData){
                                var app_ids = [];
                                if(allMarklistData.app_id != undefined || allMarklistData.app_id != null){
                                    app_ids  = allMarklistData.app_id.split(',');
                                }
                                for(var i=0;i<app_ids.length;i++){
                                    if(application.id == app_ids[i]){
                                        if((allMarklistData.file_name!='null' && allMarklistData.file_name!=null && allMarklistData.file_name!='' ) && (allMarklistData.usermarklist_file_name ==null || allMarklistData.usermarklist_file_name =='')){
                                            var imgArr = allMarklistData.file_name.split('.');
                                            var extension = imgArr[imgArr.length - 1].trim(); 
                                        } else if((allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='')){
                                            var imgArr1 = allMarklistData.usermarklist_file_name.split('.');
                                            var extension = imgArr1[imgArr1.length - 1].trim(); 
                                        }else if((allMarklistData.file_name!='null' && allMarklistData.file_name!=null && allMarklistData.file_name!='') && (allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='')){
                                            var imgArr = allMarklistData.file_name.split('.');
                                            var extension = imgArr[imgArr.length - 1].trim(); 
                                            var imgArr1 = allMarklistData.usermarklist_file_name.split('.');
                                            var extension1 = imgArr1[imgArr1.length - 1].trim(); 
                                        }
                                        if(allMarklistData.collegeId != 0 && allMarklistData.collegeId != null){
                                            models.College.findAll({
                                                where:{
                                                    id : allMarklistData.collegeId
                                                }
                                            }).then(function(college){
                                                if((allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='') && (allMarklistData.usermarklist_file_name==null || allMarklistData.usermarklist_file_name=='')){
                                                    studentObj.userMarkLists.push({
                                                        id: allMarklistData.id,
                                                        //userMarklistId: usermarks.id,
                                                        name: allMarklistData.name,
                                                        user_id: allMarklistData.user_id ,
                                                        image:serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                                        file_name: allMarklistData.file_name ,
                                                        file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                                        timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                        updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                        transcript_lock: allMarklistData.lock_transcript ,
                                                        education_type:allMarklistData.education_type ,
                                                        extension : extension ,
                                                        // email : user.email,
                                                        collegeName : college.name,
                                                        app_id:application.id 
                                                    });
                                                }else if((allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='' )){
                                                    studentObj.userMarkLists.push({
                                                        id: allMarklistData.usermarklist_id,
                                                        //userMarklistId: usermarks.id,
                                                        name: allMarklistData.usermarklist_name,
                                                        user_id: allMarklistData.usermarklist_user_id ,
                                                        image: serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                        file_name: allMarklistData.usermarklist_file_name ,
                                                        file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                        timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                        transcript_lock: allMarklistData.user_lock_marklist ,
                                                        education_type:allMarklistData.type ,
                                                        extension : extension ,
                                                        email : user.email,
                                                        collegeName : college.name,
                                                        app_id:application.id 
                                                    });
                                                }else if(allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='' && allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!=''){
                                                    studentObj.userMarkLists.push({
                                                        id: allMarklistData.id,
                                                        //userMarklistId: usermarks.id,
                                                        name: allMarklistData.name,
                                                        user_id: allMarklistData.user_id ,
                                                        image: serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                                        file_name: allMarklistData.file_name ,
                                                        file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                                        timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                        updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                        transcript_lock: allMarklistData.lock_transcript ,
                                                        education_type:allMarklistData.education_type ,
                                                        extension : extension ,
                                                        email : user.email,
                                                        collegeName : college.name,
                                                        app_id:application.id 
                                                    });
                                                }
                                            })
                                        }else{
                                            if((allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='') && (allMarklistData.usermarklist_file_name==null || allMarklistData.usermarklist_file_name=='')){
                                                studentObj.userMarkLists.push({
                                                    id: allMarklistData.id ? allMarklistData.usermarklist_id : '',
                                                    name: allMarklistData.name,
                                                    // userMarklistId: userMarks.id,
                                                    user_id: allMarklistData.user_id,
                                                    image:serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.file_name,
                                                    file_name: allMarklistData.file_name,
                                                    file_path:FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.file_name,
                                                    timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                    updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                    transcript_lock: allMarklistData.lock_transcript,
                                                    education_type:allMarklistData.education_type,
                                                    extension :extension,
                                                    // email : user.email,
                                                    app_id:application.id ,
                                                    collegeName : ''
                                                });
                                            }else if((allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='')){
                                                studentObj.userMarkLists.push({
                                                    id: allMarklistData.usermarklist_id,
                                                    //userMarklistId: usermarks.id,
                                                    name: allMarklistData.usermarklist_name,
                                                    user_id: allMarklistData.usermarklist_user_id ,
                                                    image: serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                    file_name: allMarklistData.usermarklist_file_name ,
                                                    file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                                    timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                                    updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                    transcript_lock: allMarklistData.user_lock_marklist ,
                                                    education_type:allMarklistData.type ,
                                                    extension : extension ,
                                                    email : user.email,
                                                    collegeName : college.name,
                                                    app_id:application.id 
                                                });
                                            }else if(allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='' && allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!=''){
                                                studentObj.userMarkLists.push({
                                                    id: allMarklistData.id,
                                                    //userMarklistId: usermarks.id,
                                                    name: allMarklistData.name,
                                                    user_id: allMarklistData.user_id ,
                                                    image: serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                                    file_name: allMarklistData.file_name ,
                                                    file_path:FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                                    timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                                    updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                                    transcript_lock: allMarklistData.lock_transcript ,
                                                    education_type:allMarklistData.education_type ,
                                                    extension : extension ,
                                                    email : user.email,
                                                    collegeName : college.name,
                                                    app_id:application.id 
                                                });
                                            }
                                        } 
                                    }
                                }
                            })
                        })
                    }
                    setTimeout(()=>{
                        if( userTranscripts.length > 0){
                            res.json({
                                status: 200,
                                message: 'Dashboard success',
                                data: studentObj,
                                app_id:application.id
                                // userEmail : userEmail
                            });
                        }else{
                            res.json({
                                status: 400,
                                message: 'Transcipt not avaliable of this student !!',
                                data: studentObj,
                                // userEmail : userEmail
                            });
                        }
                    },3000);
                }
            }
    }
    else{
        let userTranscripts= await functions.userTranscriptdata(userId)
        if(userTranscripts && userTranscripts.length > 0) {
            userTranscripts.forEach(function(userTranscript) {
                if(userTranscript.type.includes('transcripts')){
                    var imgArr = userTranscript.file_name.split('.');
                    var extension = imgArr[imgArr.length - 1].trim();
                    if(userTranscript.collegeId != 0 && userTranscript.collegeId != null){
                        models.College.findAll({
                            where:{
                                id : userTranscript.collegeId
                            }
                        }).then(function(college){
                            studentObj.userTranscripts.push({
                                id: userTranscript.id,
                                name: userTranscript.name,
                                user_id: userTranscript.user_id,
                                image: serverUrl+"/upload/documents/"+userId+'/'+userTranscript.file_name,
                                file_name: userTranscript.file_name,
                                file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+userTranscript.file_name,
                                timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                                updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                transcript_lock: userTranscript.lock_transcript,
                                extension :extension,
                                // email : user.email,
                                collegeName : college.name, 
                                app_id:application.id 
                            });
                        });
                    }
                    else{
                        studentObj.userTranscripts.push({
                            id: userTranscript.id,
                            name: userTranscript.name,
                            user_id: userTranscript.user_id,
                            image: serverUrl+"/upload/documents/"+userId+'/'+userTranscript.file_name,
                            file_name: userTranscript.file_name,
                            file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+userTranscript.file_name,
                            timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                            updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                            transcript_lock: userTranscript.lock_transcript,
                            extension :extension,
                            email : user.email,
                            collegeName : '',   
                            app_id:application.id 
                        });
                    }
                }else{
                    studentObj.userExtraDocument.push({
                        id: userTranscript.id,
                        name: userTranscript.name,
                        user_id: userTranscript.user_id,
                        image: serverUrl+"/upload/documents/"+userId+'/'+userTranscript.file_name,
                        file_name: userTranscript.file_name,
                        file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+userTranscript.file_name,
                        timestamp: moment(new Date(userTranscript.created_at)).format("DD-MM-YYYY hh:mm a"),
                        updated_at: moment(new Date(userTranscript.updated_at)).format("DD-MM-YYYY hh:mm a"),
                        transcript_lock: userTranscript.lock_transcript,
                        extension :extension,
                        app_id:application.id,
                    });
                }
            });
            let userMarkLists= await functions.userMarkList(application.user_id)
            if(userMarkLists!=undefined || userMarkLists!='' || userMarkLists!='null' || userMarkLists!=null){
                models.UserMarklist_Upload.getMarksheetData(userMarkLists[0].user_id).then(function(marklistData){
                    marklistData.forEach(function(allMarklistData){
                        if((allMarklistData.file_name!='null' && allMarklistData.file_name!=null && allMarklistData.file_name!='' ) && (allMarklistData.usermarklist_file_name ==null || allMarklistData.usermarklist_file_name =='')){
                            var imgArr = allMarklistData.file_name.split('.');
                            var extension = imgArr[imgArr.length - 1].trim(); 
                        } else if((allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='')){
                            var imgArr1 = allMarklistData.usermarklist_file_name.split('.');
                            var extension = imgArr1[imgArr1.length - 1].trim(); 
                        }else if((allMarklistData.file_name!='null' && allMarklistData.file_name!=null && allMarklistData.file_name!='') && (allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='')){
                            var imgArr = allMarklistData.file_name.split('.');
                            var extension = imgArr[imgArr.length - 1].trim(); 
                            var imgArr1 = allMarklistData.usermarklist_file_name.split('.');
                            var extension1 = imgArr1[imgArr1.length - 1].trim(); 
                        }
                        if(allMarklistData.collegeId != 0 && allMarklistData.collegeId != null){
                            models.College.findAll({
                                where:{
                                    id : allMarklistData.collegeId
                                }
                            }).then(function(college){
                                if((allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='') && (allMarklistData.usermarklist_file_name==null || allMarklistData.usermarklist_file_name=='')){
                                    studentObj.userMarkLists.push({
                                        id: allMarklistData.id,
                                        //userMarklistId: usermarks.id,
                                        name: allMarklistData.name,
                                        user_id: allMarklistData.user_id ,
                                        image:serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                        file_name: allMarklistData.file_name ,
                                        file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                        timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        transcript_lock: allMarklistData.lock_transcript ,
                                        education_type:allMarklistData.education_type ,
                                        extension : extension ,
                                        // email : user.email,
                                        collegeName : college.name,
                                        app_id:application.id 
                                    });
                                }else if((allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='' )){
                                    studentObj.userMarkLists.push({
                                        id: allMarklistData.usermarklist_id,
                                        //userMarklistId: usermarks.id,
                                        name: allMarklistData.usermarklist_name,
                                        user_id: allMarklistData.usermarklist_user_id ,
                                        image: serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                        file_name: allMarklistData.usermarklist_file_name ,
                                        file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                        timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                        transcript_lock: allMarklistData.user_lock_marklist ,
                                        education_type:allMarklistData.type ,
                                        extension : extension ,
                                        email : user.email,
                                        collegeName : college.name,
                                        app_id:application.id 
                                    });
                                }else if(allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='' && allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!=''){
                                    studentObj.userMarkLists.push({
                                        id: allMarklistData.id,
                                        //userMarklistId: usermarks.id,
                                        name: allMarklistData.name,
                                        user_id: allMarklistData.user_id ,
                                        image: serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                        file_name: allMarklistData.file_name ,
                                        file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                        timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        transcript_lock: allMarklistData.lock_transcript ,
                                        education_type:allMarklistData.education_type ,
                                        extension : extension ,
                                        email : user.email,
                                        collegeName : college.name,
                                        app_id:application.id 
                                    });
                                }
                            })
                        }else{
                            if((allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='') && (allMarklistData.usermarklist_file_name==null || allMarklistData.usermarklist_file_name=='')){
                                studentObj.userMarkLists.push({
                                    id: allMarklistData.id ? allMarklistData.usermarklist_id : '',
                                    name: allMarklistData.name,
                                    // userMarklistId: userMarks.id,
                                    user_id: allMarklistData.user_id,
                                    image:serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.file_name,
                                    file_name: allMarklistData.file_name,
                                    file_path:FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.file_name,
                                    timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                    updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                    transcript_lock: allMarklistData.lock_transcript,
                                    education_type:allMarklistData.education_type,
                                    extension :extension,
                                    email : user.email,
                                    app_id:application.id ,
                                    collegeName : ''
                                });
                            }else if((allMarklistData.usermarklist_file_name !='null' && allMarklistData.usermarklist_file_name !=null && allMarklistData.usermarklist_file_name !='') && (allMarklistData.file_name ==null || allMarklistData.file_name =='')){
                                studentObj.userMarkLists.push({
                                    id: allMarklistData.usermarklist_id,
                                    //userMarklistId: usermarks.id,
                                    name: allMarklistData.usermarklist_name,
                                    user_id: allMarklistData.usermarklist_user_id ,
                                    image: serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                    file_name: allMarklistData.usermarklist_file_name ,
                                    file_path: FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.usermarklist_file_name ,
                                    timestamp: moment(new Date(allMarklistData.usermarklist_created_at)).format("DD-MM-YYYY hh:mm a"),
                                    updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                    transcript_lock: allMarklistData.user_lock_marklist ,
                                    education_type:allMarklistData.type ,
                                    extension : extension ,
                                    email : user.email,
                                    collegeName : college.name,
                                    app_id:application.id 
                                });
                            }else if(allMarklistData.file_name !='null' && allMarklistData.file_name !=null && allMarklistData.file_name !='' && allMarklistData.usermarklist_file_name!='null' && allMarklistData.usermarklist_file_name!=null && allMarklistData.usermarklist_file_name!=''){
                                studentObj.userMarkLists.push({
                                    id: allMarklistData.id,
                                    //userMarklistId: usermarks.id,
                                    name: allMarklistData.name,
                                    user_id: allMarklistData.user_id ,
                                    image: serverUrl+"/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                    file_name: allMarklistData.file_name ,
                                    file_path:FILE_LOCATION+"public/upload/documents/"+userId+'/'+allMarklistData.file_name ,
                                    timestamp: moment(new Date(allMarklistData.created_at)).format("DD-MM-YYYY hh:mm a"),
                                    updated_at: moment(new Date(allMarklistData.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                    transcript_lock: allMarklistData.lock_transcript ,
                                    education_type:allMarklistData.education_type ,
                                    extension : extension ,
                                    email : user.email,
                                    collegeName : college.name,
                                    app_id:application.id 
                                });
                            }
                        } 
                    })
                })
            }
            
        }
        setTimeout(()=>{
               res.json({
                        status: 200,
                        message: 'Dashboard success',
                        data: studentObj,
                    });
                
            },3000);
    }
});

/*  Author : Priyanka Divekar
Route : reject the application
Paramater : user id and application id  and type as current tab*/

router.post('/rejectApplication',  (req,res,next)=>{
    var user_id = req.body.user_id;
    var app_id = req.body.id;
    var source_from = req.body.source_from;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/rejectApplication',{json:{"app_id":req.body.id,"userId":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Reject Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/rejectApplication',{json:{"app_id":req.body.id,"userId":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Reject Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation') {
        request.post(CONVOCATION_BASE_URL+'/rejectApplication',{json:{"app_id":req.body.id,"user_id":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'pdc') {
        request.post(PDC_BASE_URL+'/rejectApplication',{json:{"app_id":req.body.id,"userId":req.body.user_id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gumigration') {
        request.post(MIGRATION_BASE_URL+'/admin/adminDashboard/rejectApplication',{json:{"app_id":req.body.id,"userId":req.body.user_id,"type":'college',"checked" : true,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guattestation') {
        request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/rejectApplication',{json:{"user_id": user_id,"app_id":req.body.id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gumoi') {
        request.post(MOI_BASE_URL+'/admin/adminDashboard/rejectApplication',{json:{"user_id": user_id,"app_id":req.body.id,"email_admin":req.user.email,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }
})

/*  Author : Priyanka Divekar
Route : Remove the application from reject tab
Paramater : user id and application id  and type as current tab*/

router.post('/removeFromReject',  (req,res,next)=>{
    var user_id = req.body.user_id;
    var app_id = req.body.id;
    var source_from = req.body.source_from;
    if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/removeFromReject',{json:{"app_id":req.body.id,"user_id":req.body.user_id,"email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/removeFromReject',{json:{"app_id":req.body.id,"user_id":req.body.user_id,"email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation') {
        request.post(CONVOCATION_BASE_URL+'/removeFromReject',{json:{"app_id":req.body.id,"userId":req.body.user_id,"email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'pdc') {
        request.post(PDC_BASE_URL+'/removeFromReject',{json:{"app_id":req.body.id,"userId":req.body.user_id,"email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gumigration') {
        request.post(MIGRATION_BASE_URL+'/admin/adminDashboard/removeFromReject',{json:{"app_id":req.body.id,"userId":req.body.user_id,"type":'college',"checked" : true,"email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guattestation') {
        request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/pending/removeFromReject',{json:{"user_id": user_id,"app_id":req.body.id,"email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if( source_from == 'gumoi' ) {
        request.post(MOI_BASE_URL+'/admin/adminDashboard/pending/removeFromReject',{json:{"user_id": user_id,"app_id":req.body.id,"email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }
    
})

router.get('/regeneratePdf',  (req,res,next)=>{
    var user_id = req.query.user_id;
    var app_id = req.query.app_id;
    var source_from = req.query.source_from;
    var reason = req.query.reg_reason;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	if(source_from == 'guverification'){
        request.get(VERIFY_BASE_URL+'/application/regeneratePdf?appl_id=' + app_id + '&user_id=' + user_id+'&reg_reason=' + reason + '&email_admin=' + req.user.email+'&clientIP='+clientIP,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.get(SY_VERIFY_BASE_URL+'/application/regeneratePdf?appl_id=' + app_id + '&user_id=' + user_id+'&reg_reason=' + reason + '&email_admin=' + req.user.email+'&clientIP='+clientIP,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation') {
        request.get(CONVOCATION_BASE_URL+'/application/regeneratePdf?appl_id=' + app_id,'&user_id=' + user_id,'&reg_reason=' + reason + '&email_admin=' + req.user.email+'&clientIP='+clientIP,
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'pdc') {
        request.get(PDC_BASE_URL+'/application/regeneratePdf?appl_id=' + app_id,'&user_id=' + user_id,'&reg_reason=' + reason + '&email_admin=' + req.user.email+'&clientIP='+clientIP,
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gumigration') {
        request.get(MIGRATION_BASE_URL+'/admin/adminDashboard/regeneratePdf?appl_id=' + app_id,'&user_id=' + user_id,'&reg_reason=' + reason + '&email_admin=' + req.user.email+'&clientIP='+clientIP,
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'guattestation') {
        request.get(ATTESTATION_BASE_URL+'/admin/adminDashboard/regeneratePdf?appl_id=' + app_id + '&user_id=' + user_id + '&reg_reason=' + reason + '&email_admin=' + req.user.email+'&clientIP='+clientIP,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }else{
                    res.json({
                        status : 400,
                        message : data.message
                    })
                }
            }
        })
    }else if( source_from == 'gumoi') {
        request.get(MOI_BASE_URL+'/admin/adminDashboard/regeneratePdf?appl_id=' + app_id + '&user_id=' + user_id + '&reg_reason=' + reason + '&email_admin=' + req.user.email+'&clientIP='+clientIP,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }else{
                    res.json({
                        status : 400,
                        message : data.message
                    })
                }
            }
        })
    }
})

router.get('/downloadFiles',function (req, res) {
    const downloadData =  req.query.documentFile;
    res.download(downloadData);
});

router.get('/resetDoc', (req,res)=>{ 
    var user_id = req.query.user_id;
        request.get(ATTESTATION_BASE_URL+'/attestation/deleteAppId?user_id=' + user_id + '&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        message: data['message'],
                    })
                }else{ 
                    res.json({
                        status:400,
                        message: data['message'],
                    })
                }
            }
        })

        request.get(VERIFY_BASE_URL+'/application/deleteAppId?user_id=' + user_id + '&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{ 
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        message: data['message'],
                    })
                }else{
                    res.json({
                        status:400,
                        message: data['message'],
                    })
                }
            }
        })

        request.get(MOI_BASE_URL+'/attestation/deleteAppId?user_id=' + user_id + '&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){ 
                    res.json({
                        status:200,
                        message: data['message'],
                    })
                }else{
                    res.json({
                        status:400,
                        message: data['message'],
                    })
                }
            }
        })
    })

router.get('/getFileData',function (req,res){
    var page = req.query.page;
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];
    var date = moment(new Date(req.query.date)).format('DD-MM-YYYY');
    models.Application.getFileData(filters,null,null).then(function(fileData1){
        countObjects.totalLength = fileData1.length;
        models.Application.getFileData(filters,limit,offset).then(function(fileData){
           
            res.json({
                status : 200,
                data : fileData,
                countObjects : countObjects
            })
        })
    })
})

router.get('/downloadFileExcel',function(req,res){
    var date = moment(new Date(req.query.date)).format('YYYY-MM-DD');
    var excelData = [];
    models.Application.getVerifiedDataByDate(date).then(function(verifiedData){
        require('async').each(verifiedData, function(data, callback) {
            excelData.push({
                'ApplicationId' : data.app_id,
                'StudentName' : data.name,
                'StudentEmail' : data.email,
                'AppliedService' : data.service,
                'RackNo' : '',
                'RowNo' : '',
                'FileNo' : moment(new Date(date)).format('DDMMYYYY')
            })
                callback();
           
        },function(error, results) {
            setTimeout(()=>{
                            
                var xls = json2xls(excelData);
                var file_location = FILE_LOCATION +"public/Excel/" + date + "_fileManagement.xlsx";
                fs.writeFileSync(file_location, xls, 'binary');
                
            
                res.json({
                    status: 200,
                    data: file_location,
                });
            },2000)
           
        });
    })
})

router.post('/uploadExcel', function(req, res) {
    var image;
    var dir = FILE_LOCATION + "public/Excel/uploaded"; 
    if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
    var ext;
    var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, FILE_LOCATION+"public/Excel/uploaded");
		},
		filename: function(req, file, callback) {
			image = file.originalname;
			callback(null, file.originalname);
			
		}
	});

	var upload = multer({
		storage: storage,
		fileFilter: function (req, file, callback) {
			ext = path.extname(file.originalname)
			if (ext !== '.xlsx') {
				return callback(res.end('Please upload document in .xlsx format only'), null)
			}
			callback(null, true)
		}
	}).single('file');

    upload(req, res, function (err, data) {
		var sheet_name = dir + "/"+image;
        var workbook = XLSX.readFile(sheet_name);
        var sheet_name_list = workbook.SheetNames;
        var arrayOfObject =[];
        sheet_name_list.forEach(function(y) {
        var worksheet = workbook.Sheets[y];
        var headers = {};
        for(z in worksheet) {
            if(z[0] === '!') continue;
            //parse out the column, row, and value
            var tt = 0;
            for (var i = 0; i < z.length; i++) {
                if (!isNaN(z[i])) {
                    tt = i;
                    break;
                }
            };
            var col = z.substring(0,tt);
            var row = parseInt(z.substring(tt));
            var value = worksheet[z].v;
            //store header names
            if(row == 1 && value) {
                headers[col] = value;
                continue;
            }
            if(!arrayOfObject[row]) arrayOfObject[row]={};
                arrayOfObject[row][headers[col]] = value;
            }
            //drop those first two rows which are empty
            arrayOfObject.shift();
            arrayOfObject.shift();
        });
        require('async').eachSeries(arrayOfObject, function(obj, callback){
           models.Application.update({
                rackNo : obj.RackNo,
                rowNo : obj.RowNo
            },{
                where:{
                    id : obj.ApplicationId
                }
            });
            callback();
        }, function(){
            res.json({
                status: 200,
                message:'excel uploaded successfully',
            });
        });
	});
});

//shaquib
router.get('/getallpedingpayment',  async (req, res) => {
        var date = req.query.date ? req.query.date : '';
        var formatetDate = moment(new Date(date)).format("DD/MM/YYYY")
        var page = req.query.page;
        var email = req.query.email ? req.query.email : '';
        var value = req.query.value ? req.query.value : '';
        var limit = 10;
        var offset = (page - 1) * limit;
        var countObjects = {};
        var filters = [];
    
        if (email != '' && email != null && email != undefined && email != 'null' && email != 'undefined') {
            var filter = {};
            filter.name = 'email';
            filter.value = email;
            filters.push(filter);
        }
    
    
    
        if (date != '' && date != null && date != undefined && date != 'null' && date != 'undefined') {
    
            var filter = {};
            filter.name = 'date';
            filter.value = formatetDate;
            filters.push(filter);
        }
    
        var data = []; var countObj = {};
    
        models.paymenterror_details.getpending(filters, null, null,value).then(function (useractivity) {
           countObjects.totalLength = useractivity.length;
            
            models.paymenterror_details.getpending(filters, limit,offset,value).then(function (filter_activity) {
                countObjects.filteredLength = filter_activity.length;
                var acticity_data = [];
                if (filter_activity != null) {
                    require('async').eachSeries(filter_activity, function (student, callback) {
    
                        var obj = {
                            email: (student.email) ? student.email : '',
                            transaction_id: (student.transaction_id) ? student.transaction_id : '',
                            order_id: (student.order_id) ? student.order_id : '',
                            bank_refno: (student.bank_refno) ? student.bank_refno : '',
                            date: (student.date) ? student.date : '',
                            amount: (student.amount) ? student.amount : '',
                            selectissuetype: (student.selectissuetype) ? student.selectissuetype : '',
                            note: (student.note) ? student.note : '',
                            user_id: (student.user_id) ? student.user_id : '',
                            tracker: (student.tracker) ? student.tracker : '',
                            source: (student.source) ? student.source : '',
                            updated_at: moment(student.updated_at).format("DD/MM/YYYY"),
    
                        
                        };
    
                        acticity_data.push(obj);
                        callback();
    
                    }, function () {
                        res.json({
                            status: 200,
                            message: 'Student retrive successfully',
                            items: acticity_data,
                            total_count: countObjects,
                        });
                    });
                } else {
                    res.json({
                        status: 400,
                        message: 'Problem in retrieving student list'
                    });
                }
    
    
            });
    
        });
})

router.get('/getAll_Paydetails', function (req, res) {
    var id = req.query.id;
    var page = req.query.page;
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var order_id = req.query.order_id ? req.query.order_id : "";
    var bank_ref_no = req.query.bank_ref_no ? req.query.bank_ref_no : "";
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters = [];
  
    if (id != '' && id != null && id != undefined && id != 'null' && id != 'undefined') {
      var filter = {};
      filter.name = 'application_id';
      filter.value = id;
      filters.push(filter);
    }
  
    if (name != '' && name != null && name != undefined && name != 'null' && name != 'undefined') {
      var filter = {};
      var filter1 = {};
      var nameSplit = name.split(' ');
      if (nameSplit.length == 1) {
        filter.name = 'name';
        filter.value = " AND( u.name like '%" + nameSplit[0] + "%' OR u.surname like '%" + nameSplit[0] + "%') ";
        filters.push(filter);
      } else if (nameSplit.length == 2) {
        filter.name = 'name';
        filter.value = " AND u.name like '%" + nameSplit[0] + "%' AND u.surname like '%" + nameSplit[1] + "%' ";
        filters.push(filter);
      } else {
        filter.name = 'name';
        var lastElement = nameSplit.pop();
        filter.value = " AND u.name like '%" + nameSplit.join(' ') + "%' AND u.surname like '%" + lastElement + "%' ";
        filters.push(filter);
      }
  
    }
  
    if (email != '' && email != null && email != undefined && email != 'null' && email != 'undefined') {
      var filter = {};
      filter.name = 'email';
      filter.value = email;
      filters.push(filter);
    }
    if (
      order_id != "" &&
      order_id != null &&
      order_id != undefined &&
      order_id != "null" &&
      order_id != "undefined"
    ) {
      var filter = {};
      filter.name = "order_id";
      filter.value = order_id;
      filters.push(filter);
    }
  
    if (
      bank_ref_no != "" &&
      bank_ref_no != null &&
      bank_ref_no != undefined &&
      bank_ref_no != "null" &&
      bank_ref_no != "undefined"
    ) {
      var filter = {};
      filter.name = "bank_ref_no";
      filter.value = bank_ref_no;
      filters.push(filter);
    }
  
  
    var data = []; var countObj = {};
    // fetch total active & inactive student count from db.
    models.Application.getTotalpaid(filters, null, null).then(function (studentsData) {
      countObjects.totalLength = studentsData.length;
      models.Application.getTotalpaid(filters, limit, offset).then(function (students) {
        countObjects.filteredLength = students.length;
        if (students != null) {
  
          require('async').eachSeries(students, function (student, callback) {
            var obj = {
              id: (student.id) ? student.id : '',
              user_id: (student.user_id) ? student.user_id : '',
              name: (student.name) ? student.name : '',
              email: (student.email) ? student.email : '',
              tracking_id: (student.tracking_id) ? student.tracking_id : '',
              bank_ref_no: (student.bank_ref_no) ? student.bank_ref_no : '',
              order_id: (student.order_id) ? student.order_id : '',
              created_at: moment(student.created_at).format("DD/MM/YYYY"),
              source_from: (student.source_from) ? student.source_from : '',
              amount: student.ord_amount ? student.ord_amount : "",
              applying_for: student.applying_for ? student.applying_for : "",
            };
  
            data.push(obj);
            callback();
          }, function () {
            res.json({
              status: 200,
              message: 'Student retrive successfully',
              items: data,
              total_count: countObjects,
            });
          });
        } else {
          res.json({
            status: 400,
            message: 'Problem in retrieving student list'
          });
        }
  
      });
    })
  })
  
  router.get('/downloadExcel_date', function (req, res) {
    var TotalAppdata = [];
    var startDate = req.query.startDate;
    var endDate = moment(req.query.endDate).add(1, 'days').format('YYYY-MM-DD');
  
    models.Application.downloadExcel_date(startDate, endDate).then((data) => {
      if (data != null || data != undefined) {
  
        require('async').each(data, function (data, callback) {
          TotalAppdata.push({
            'Application Id': data.id,
            'Student Name': data.name,
            'Student Email': data.email,
            'Student Contact No': data.mobile,
            'order_id': data.order_id,
            "Transaction Id": data.tracking_id,
            'Application Date': moment(data.created_at).format("DD-MM-YYYY"),
            "Bank Reference No": data.bank_ref_no,
            "contact no": data.mobile,
            "ord_amount": data.ord_amount,
            // "referenceNo":data.referenceNo,
            // "serviceType":data.serviceType,
            "split status": data.split_status,
            "source_from": data.source_from
          });
          callback();
        }, function (error, results) {
  
          setTimeout(function () {
            var xls = json2xls(TotalAppdata);
            // var FILE_LOCATION = FILE_LOCATION + "/public/Excel/TotalPaid_application.xlsx";
  
            var filepath = FILE_LOCATION + "/public/Excel/TotalPaid_application.xlsx";
            fs.writeFileSync(filepath, xls, 'binary');
            // fs.writeFileSync(FILE_LOCATION + "/public/upload/Excel/" + type + ".xlsx", xls, 'binary');
            // var filepath = FILE_LOCATION + "/public/upload/Excel/" + type + ".xlsx";
  
            res.json({
              status: 200,
              data: filepath
            });
  
          }, 13000);
        });
      } else {
        res.json({
          status: 400,
  
        })
      }
    })
  
  })
router.get('/getPaymentDetails',function(req,res){
    var data = [];
    var counter = 0;
    if(req.query.tab_type == '1stPayment'){
        models.Transaction.getPaymentDetails(req.query.tab_type).then(function(applications) {
            if(applications != null) {
                applications.forEach(function(application) {
                    counter ++;
                    var statusTrackerData = {
                        "reference_no": application.tracking_id,
                        //"order_no": application.order_id
                    }

                    
                });

    
    
                setTimeout(function(){ 
                    var sort_data = data.sort(function(a, b){return (b.order_id) - (a.order_id)});
                    res.json({
                        status: 200,
                        message: '2ndSplit payment tab data loaded',
                        data: data
                    });
                }, 15000);
            }
        });
    }else if(req.query.tab_type == '1stRefund'){
        models.Transaction.getPaymentDetails(req.query.tab_type).then(function(applications) {
            if(applications != null) {
                applications.forEach(function(application) {
                    data.push({
                        order_id : application.order_id,
                        tracking_id : application.tracking_id,
                        name : application.name,
                        exists : application.refund_status,
                        email : application.email,
                        uni_share : parseFloat(application.university_share),
                        edu_share : parseFloat(application.a),
                        cc_share : (parseFloat(application.amount) - (parseFloat(application.b) + parseFloat(application.a))).toFixed(2)
                    });
                });
                setTimeout(function(){ 
                    res.json({
                        status: 200,
                        message: '1st Refund payment tab data loaded',
                        data: data
                    });
                }, 3000);
            }
        });
    }
});
 
router.post('/setResolve', async (req, res) => {
    
        var payid = req.body.id;
        var email_id= req.body.email;
        var source= req.body.value;
    
            models.paymenterror_details.update({
                tracker: 'resolved'
            }, {
                where: {
                    id: payid,
                    source: 'guconvocation'
                }
    
            }).then(function (data) {
                if (data.length == 1) {
                    request.post(BASE_URL_SENDGRID + 'Paymenterror_toStudent', {
                        json: {
                            email: email_id,
                            status: 200,
                            source: source
    
    
                        }
                    }, function (error, response, body) {
                        if (response) {
                            res.json({
                                status: 200,
                                
                            })
                        } else {
                            status: 400
                        }
                    })
                  
                } else {
                    res.json({
                        status: 400,
        
                    })
                }
    
            })
            request.post(BASE_URL_SENDGRID + 'Paymenterror_toStudent', {
                json: {
                    status: 200,
                }
            }, function (error, response, body) {
                if (response) {
                    res.json({
                        status: 200,
                        
                    })
                } else {
                    status: 400
                }
            })
})

router.post('/outward', async (req,res,next)=>{
    var user_id=req.body.user_id
    var app_id=req.body.app_id
    var source=req.body.source
    var outward=req.body.outward
    if(source=='pdc'){
        let updateoutward = await functions.updateoutwardnumber(user_id,app_id,outward)
        if(updateoutward.length>0){
        res.json({
            status:200
        })
        }
    }else if(source=='guattestation' || source == 'gumoi'){

    }else if(source=='guconvocation'){

    }else if(source=='gumigration'){

    }
})
    
router.get('/downloadExcel',getUserRole , function (req, res) {
    var tracker=req.query.tracker
    var status=req.query.status
    var service=req.query.service
    var tab=req.query.tab;
    var purposeDetails='';
    var applicationData = [];
    var startDate = (req.query.startDate) ? moment(new Date(req.query.startDate)).format("YYYY-MM-DD") : '';
    var endDate = (req.query.endDate) ? moment(new Date(req.query.endDate)).add(1,'days').format("YYYY-MM-DD") : '';
    models.Application.getDateWiseApplications(tracker,status,req.superRoles,startDate, endDate,service).then(function(appData){
        require('async').eachSeries(appData, function(data, callback){
            models.Institution_details.findAll({
                where :{ 
                    app_id : data.app_id
                }
            }).then(function (inst){
                for(var i =0 ; i < inst.length ; i++ ){
                    if(inst[i].deliveryType == 'physcial'){
                        purposeDetails += ',' + inst[i].type + '(' + inst[i].noofcopies+ ')'
                    }else{
                        if(inst[i].type == 'Educational credential evaluators WES'){
                            purposeDetails += inst[i].type
                        }else{
                            purposeDetails += inst[i].type + '(' + inst[i].email+ ')'
                        }
                       
                    }
                }
                if(tab == 'pending'){
                    applicationData.push({
                        'ApplicationId': data.app_id,
                        'Full Name': (data.marksheetName) ? data.marksheetName : data.fullname,
                        'Email': data.email,
                        'ContactNo': data.contactNumber,
                        'Service':data.Service,
                        'Status': data.STATUS,
                        'Pending' : data.pending,
                        "purpose" : purposeDetails,
                        "Application Date": moment(data.created_at).format("DD-MM-YYYY")
                    });
                }else if(tab == 'verified'){
                    applicationData.push({
                        'ApplicationId': data.app_id,
                        'Full Name': (data.marksheetName) ? data.marksheetName : data.fullname,
                        'Email': data.email,
                        'Status': data.STATUS,
                        'ContactNo': data.contactNumber,
                        'Service':data.Service,
                        'OutwardNO': data.outward,
                        'Approved By': data.verifiedBy,
                        "Approved Date" : data.verifiedDate,
                        'Approved since' : data.pending,
                        "purpose" : purposeDetails,
                        "Application Date": moment(data.created_at).format("DD-MM-YYYY")
                    });
                }else if(tab == 'signed'){
                    applicationData.push({
                        'ApplicationId': data.app_id,
                        'Full Name': (data.marksheetName) ? data.marksheetName : data.fullname,
                        'Email': data.email,
                        'Status': data.STATUS,
                        'ContactNo': data.contactNumber,
                        'Service':data.Service,
                        'OutwardNO': data.outward,
                        'Signed since': data.pending,
                        'Approved By': data.verifiedBy,
                        "Approved Date" : data.verifiedDate,
                        'Verified By': data.printBy,
                        'Verified date' : data.printDate,
                        'OutwardNO': data.outward,
                        "purpose" : purposeDetails,
                        "Wes details Updated" : (data.wes_error == 1) ? 'wes details updated' : data.wes_error,
                        "Application Date": moment(data.created_at).format("DD-MM-YYYY")
                    });
                }else if(tab == 'print'){
                    if(data.Service == 'Migration Certificate'){
                        // models.Applicant_Educational_Details.findAll({
                        //     where :{
                        //         user_id : data.user_id
                        //     }
                        // }).then(function(eduDetails){
                        //     eduDetails.forEach(edu=>{
                        //         var address = edu.address.filter(add=>(add.addtype === data.app_status))
                        //         applicationData.push({
                        //             'ApplicationId': data.app_id,
                        //             'Full Name': data.name,
                        //             'Email': data.email,
                        //             'ContactNo': data.mobile_country_code + '-' + data.mobile,
                        //             'Service':data.service,
                        //             'Tracker':data.tracker,
                        //             'InwardNo' : data.inward,
                        //             'OutwardNO': data.outward,
                        //             'Address' : address.address,
                        //             'Barcode': '',
                        //             'SenderMobile': '',
                        //             'Weight': '20',
                        //             'print_date': data.print_date,
                        //             'print_status' : 'N/A' // for verification and attestation
                        //         });
                        //     })
                        // })
                    }else if(data.Service == 'Provisional Degree Certificate' || data.Service == 'Convocation Certificate'){
                        // models.edu_details.findAll({
                        //     where :{
                        //         user_id : data.user_id,
                        //         app_id : data.id
                        //     }
                        // }).then(function(eduDetails){
    
                        //     eduDetails.forEach(edu=>{
                        //         var address = edu.address.filter(add=>(add.addtype === data.app_status))
                        //         applicationData.push({
                        //             'ApplicationId': data.app_id,
                        //             'Full Name': data.name,
                        //             'Email': data.email,
                        //             'ContactNo': data.mobile_country_code + '-' + data.mobile,
                        //             'Service':data.service,
                        //             'Tracker':data.tracker,
                        //             'InwardNo' : data.inward,
                        //             'OutwardNO': data.outward,
                        //             'Address' : address.address,
                        //             'Barcode': '',
                        //             'SenderMobile': '',
                        //             'Weight': '20',
                        //             'print_date': data.print_date,
                        //             'print_status' : 'N/A' // for verification and attestation
                        //         });
                        //     })
                        // })
                    }else if(data.Service == 'guattestation' || data.Service == 'guverification' || data.Service == 'gumoi' || data.Service == 'gusyverification'){
                        applicationData.push({
                            'ApplicationId': data.app_id,
                            'Full Name': (data.marksheetName) ? data.marksheetName : data.fullname,
                            'Email': data.email,
                            'ContactNo': data.contactNumber,
                            'Service':data.Service,
                            'Weight': '20',
                            'print_status' : data.STATUS,
                            'Print since': data.pending,
                            'OutwardNO': data.outward,
                            'Approved By': data.verifiedBy,
                            "Approved Date" : data.verifiedDate,
                            'Verified By': data.printBy,
                            'Verified date' : data.printDate,
                            "purpose" : purposeDetails,
                            "Application Date": moment(data.created_at).format("DD-MM-YYYY")
                        });
                    }
                }else if(tab == 'printbyedulab'){
                    applicationData.push({
                        'ApplicationId': data.app_id,
                        'Full Name': (data.marksheetName) ? data.marksheetName : data.fullname,
                        'Email': data.email,
                        'ContactNo': data.contactNumber,
                        'Service':data.Service,
                        'Status': data.STATUS,
                        'Weight': '20',
                        'Verified since': data.pending,
                        'OutwardNO': data.outward,
                        'Approved By': data.verifiedBy,
                        "Approved Date" : data.verifiedDate,
                        'Verified By': data.printBy,
                        'Verified date' : data.printDate,
                        "purpose" : purposeDetails,
                        "Application Date": moment(data.created_at).format("DD-MM-YYYY")
                    });
                }else if(tab == 'done'){
                    applicationData.push({
                        'ApplicationId': data.app_id,
                        'Full Name': (data.marksheetName) ? data.marksheetName : data.fullname,
                        'Email': data.email,
                        'ContactNo': data.contactNumber,
                        'Service':data.Service,
                        'Status': data.STATUS,
                        'Sent since': data.pending,
                        'Approved By': data.verifiedBy,
                        "Approved Date" : data.verifiedDate,
                        'Verified By': data.printBy,
                        'Verified date' : data.printDate,
                        'Signed Date' : data.signed_date,
                        'Signed By' : data.sentBy,
                        'Sent by':data.sentBy,
                        'Print date' : data.sentDate,
                        'Print By' :  data.sentBy,
                        'OutwardNO': data.outward,
                        "purpose" : purposeDetails,
                        "Application Date": moment(data.created_at).format("DD-MM-YYYY")
                    });
                }
                purposeDetails= ''
            callback();
        })
        },function()
             {
                var xls = json2xls(applicationData);
                fs.writeFileSync(FILE_LOCATION + "public/Excel/" + tab + ".xlsx", xls, 'binary');
                var filepath = FILE_LOCATION + "public/Excel/" + tab + ".xlsx"; 
                res.json({
                    status: 200,
                    data: filepath
                });
            }, 1300);
        })
    })

router.get('/downloadExcel_wes',getUserRole , function (req, res) {
    var tracker=req.query.tracker
    var status=req.query.status
    var service=req.query.service
    var tab=req.query.tab
    var applicationData = [];
    var startDate = (req.query.startDate) ? moment(new Date(req.query.startDate)).format("YYYY-MM-DD") : '';
    var endDate = (req.query.endDate) ? moment(new Date(req.query.endDate)).add(1,'days').format("YYYY-MM-DD") : '';
    models.Application.getDateWiseApplications_wes(tracker,status,req.superRoles,startDate, endDate,service).then(function(appData){
        require('async').eachSeries(appData, function(data, callback){
        
                applicationData.push({
                    'ApplicationId': data.app_id,
                    'Full Name': (data.marksheetName) ? data.marksheetName : data.fullname,
                    'Email': data.email,
                    'ContactNo': data.contactNumber,
                    'Service':data.Service,
                    'Approved By': data.verifiedBy,
                    "Approved Date" : data.verifiedDate,
                    'Verified By': data.printBy,
                    'Verified date' : data.printDate,
                    'Signed Date' : data.signed_date,
                    'Signed By' : data.sentBy,
                    'Sent by':data.sentBy,
                    'Print date' : data.sentDate,
                    'Print By' :  data.sentBy,
                    'OutwardNO': data.outward
                });
            callback();
        },function(){
            setTimeout(function () {
                var xls = json2xls(applicationData);
                fs.writeFileSync(FILE_LOCATION + "public/Excel/" + tab + ".xlsx", xls, 'binary');
                var filepath = FILE_LOCATION + "public/Excel/" + tab + ".xlsx";
  
                res.json({
                    status: 200,
                    data: filepath
                });
  
            }, 1300);
        })
    })
  })
router.post('/uploadpending', function(req, res) {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var image;
    var today = new Date();
    var dd = today.getDate();
    var mm=today.getMonth()+1
    var yy=today.getFullYear()
    var verifydate =dd + '/' + mm + '/' + yy
    var dir = FILE_LOCATION + "/public/Excel/uploaded";
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    var ext;
    var storage = multer.diskStorage({
        destination: function(req, file, callback) {
            callback(null, FILE_LOCATION+"/public/Excel/uploaded");
        },
        filename: function(req, file, callback) {
            image = file.originalname;
            callback(null, file.originalname);
        }
    });
    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            ext = path.extname(file.originalname)
            if (ext !== '.xlsx') {
                return callback(res.end('Please upload document in .xlsx format only'), null)
            }
            callback(null, true)
        }
    }).single('file');
    upload(req, res, function (err, data) {
        var sheet_name = dir + "/"+image;
        var workbook = XLSX.readFile(sheet_name);
        var sheet_name_list = workbook.SheetNames;
        var arrayOfObject =[];
        sheet_name_list.forEach(function(y) {
        var worksheet = workbook.Sheets[y];
        var headers = {};
        for(z in worksheet) {
            if(z[0] === '!') continue;
            //parse out the column, row, and value
            var tt = 0;
            for (var i = 0; i < z.length; i++) {
                if (!isNaN(z[i])) {
                    tt = i;
                    break;
                }
            };
            var col = z.substring(0,tt);
            var row = parseInt(z.substring(tt));
            var value = worksheet[z].v;
            //store header names
            if(row == 1 && value) {
                headers[col] = value;
                continue;
            }
            if(!arrayOfObject[row]) arrayOfObject[row]={};
                arrayOfObject[row][headers[col]] = value;
            }
            //drop those first two rows which are empty
            arrayOfObject.shift();
            arrayOfObject.shift();
        });
        require('async').eachSeries(arrayOfObject, function(obj, callback){
            if(obj.Tracker=='verified'){
                if(obj.Service == 'Migration Certificate'){
                    request.post(MIGRATION_BASE_URL+'/admin/adminDashboard/verification',{json:{"app_id":obj.ApplicationId,"user_id": obj.UserId,"type":'college',"checked" : true,"email_admin":req.user.email,"outward":obj.OutwardNO,"clientIP": clientIP}},
                    function(error, response, VERIFY){
                        if(error){
                        }else{
                            if(VERIFY.status == 200){
                                res.json({
                                    status:200,
                                    message:'Application Verified Successfullly..'
                                })
                            }
                        }
                    })
                }
                if(obj.Service == 'Verification'){
                    request.post(VERIFY_BASE_URL+'/application/setVerified',{json:{"app_id":obj.ApplicationId,"userId":obj.UserId,"value":'pending',"email_admin":req.user.email,"outward":obj.OutwardNO,"clientIP": clientIP}},
                    function(error, response, VERIFY){
                        if(error){
                        }else{
                            if(VERIFY.status == 200){
                                res.json({
                                    status:200,
                                    message:'Application Verified Successfullly..'
                                })
                            }
                        }
                    })
                }
                if(obj.Service == 'Provisional Degree Certificate'){
                    request.post(PDC_BASE_URL+'/setVerified',{json:{"app_id":obj.ApplicationId,"userId":obj.UserId,"value":'pending',"email_admin":req.user.email,"outward":obj.OutwardNO,"clientIP": clientIP}},
                    function(error, response, VERIFY){
                        if(error){
                        }else{
                            if(VERIFY.status == 200){
                                res.json({
                                    status:200,
                                    message:'Application Verified Successfullly..'
                                })
                            }
                        }
                    })
                }
                if(obj.Service == 'Convocation Certificate'){
                    request.post(CONVOCATION_BASE_URL+'/setVerified',{json:{"app_id":obj.ApplicationId,"userId":obj.UserId,"value":'pending',"email_admin":req.user.email,"outward":obj.OutwardNO,"clientIP": clientIP}},
                    function(error, response, VERIFY){
                        if(error){
                        }else{
                            if(VERIFY.status == 200){
                                res.json({
                                    status:200,
                                    message:'Application Verified Successfullly..'
                                })
                            }
                        }
                    })
                }
                if(obj.Service == 'Attestation'){
                    request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/pending/verifiedBy',{json:{"app_id":obj.ApplicationId,"email_admin":req.user.email,"outward":obj.OutwardNO,"clientIP": clientIP}},
                    function(error, response, VERIFY){
                        if(error){
                        }else{
                            if(VERIFY.status == 200){
                                res.json({
                                    status:200,
                                    message:'Application Verified Successfullly..'
                                })
                            }
                        }
                    })
                }
                
                
            }
            callback();
        }, function(){
            res.json({
                status: 200,
                message:'excel uploaded successfully',
            });
        });
    });
});

router.post('/updateNoteAndApplication',function(req,res){  
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    request.post(ATTESTATION_BASE_URL+'/admin/updateNoteAndApplication',{json:{"app_id" : req.body.app_id, "user_id" : req.body.user_id, "eventChecked" : req.body.eventChecked,"type" : req.body.type,"note" : req.body.note,"clientIP": clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
})  
router.get('/getAdminInstructionalDetails',(req,res)=>{
    var data = [];
    models.InstructionalDetails.findAll(
        {
            where:{
                userId:req.query.userId
            }
        }
    ).then(user=>{
        user.forEach(function (userdata){
            data.push({
                    name : userdata.studentName,
                    course:  userdata.courseName,
                    college :userdata.collegeName,
                    duration : userdata.duration,
                    specialization : userdata.specialization,
                    yearofpassing : userdata.yearofpassing,
                    division :userdata.division,
                    app_id:userdata.app_id
                })
            })
        if(data){
            res.json({
                data :  data
            })
        }else{
            res.json({
            data  : null
            })
        }
    })
})

/*  Author : Priyanka Divekar
Route : Get all educational documents,application and purpose details of particular student 
Paramater : user id and service type   and application id*/

router.get('/getStudentApplicationDetails',(req,res)=>{
    var studentObject ={
        personalDetails : {},
        pdcDetails :{
            applicationDetails :{},
            educationDetails : [],
            documents :[]
        },
        intership :{
            applicationDetails :{},
            educationDetails : [],
            documents :[]
        },
        convocationDetails :{
            applicationDetails :{},
            educationDetails : [],
            documents :[]
        },
        migrationDetails : {
            applicationDetails :{},
            educationDetails : [],
            documents :[] 
        },
        attestationDetails :{
            applicationDetails :{},
            marksheetDetails : [],
            transcriptDetails : [],
            convocationDetails : [],
            instructionalDetails : [],
            bonafiedDetails:[],
            purpose : [],
            dubaiembassy:[]
        },
        moiDetails :{
            applicationDetails :[],
            marksheetDetails : [],
            transcriptDetails : [],
            convocationDetails : [],
            instructionalDetails : [],
            bonafiedDetails:[],
            purpose : []
        },
        verificationDetails :{
            applicationDetails :{},
            marksheetDetails: [],
            transcriptDetails: [],
            degreeDetails: [],
            supportiveDetails:[],
            documentDetails :{},
            instituteDetails : [],
            mbaCourse : false
        },
        syverificationDetails :{
            secondYearDetails :[],
            instituteDetails : []
        }
    }
    var user_id = req.query.userId;
    var services = req.query.services;
    var pdcWhere = {}, convocationWhere =  {}, migrationWhere = {}, attestationWhere ='', 
    verificationWhere = {} ,verificationTWhere = {}, syverificationWhere = {} ,intershipwhere={};
     
    let servicePromise = new Promise((resolve,reject)=>{
       
        if(services == "" || services == undefined || services ==null || services == 'null'  || services == 'undefined'){
            pdcWhere = {user_id : user_id, source : "pdc" };
            convocationWhere = {user_id : user_id, source : "guconvocation" };
            migrationWhere = {user_id : user_id, source : "gumigration"};
            intershipwhere = {user_id : user_id, source : "guinternship" };
            attestationWhere = "mrk.user_id = " + user_id;
            instructionalWhere = "mrk.userId = " + user_id;
            verificationWhere = {user_id : user_id,type:{[Op.ne] : 'secondYear'} };
            syverificationWhere = {user_id : user_id,type:'secondYear' };
            setTimeout(()=>{resolve(true)}, 1000);
        }else{
          var splitedServices = services.split(',');
            splitedServices.pop();
            splitedServices.forEach(service=>{
                if(service.includes('pdc')){
                    var splitAppId = service.split('(');
                    pdcWhere = {user_id :user_id, app_id : splitAppId[splitAppId.length-1].split(')')[0] ,source : splitAppId[0]};
                    models.User_Course_Enrollment_Detail_PDC.getApplicationDetailsById(splitAppId[splitAppId.length-1].split(')')[0]).then(function(pdcApp){
                      studentObject.pdcDetails.applicationDetails =  pdcApp[0];
                     
                    });

                    convocationWhere = {user_id : user_id, source : "guconvocation" };
                    migrationWhere = {user_id : user_id, source : "gumigration"};
                    intershipwhere = {user_id : user_id, source : "guinternship" };

                    attestationWhere = "mrk.user_id = " + user_id;
                    instructionalWhere = "mrk.userId = " + user_id;
                    verificationWhere = {user_id : user_id,type:{[Op.ne] : 'secondYear'} };
                    syverificationWhere = {user_id : user_id,type:'secondYear' };
                        
                }

                if(service.includes('guconvocation')){
                    var splitAppId = service.split('(');
                    convocationWhere = { user_id : user_id, app_id : splitAppId[splitAppId.length-1].split(')')[0],source : splitAppId[0]};
                    models.User_Course_Enrollment_Detail_Convo.getApplicationDetailsById(splitAppId[splitAppId.length-1].split(')')[0]).then(function(convoApp){
                      studentObject.convocationDetails.applicationDetails =  convoApp[0];
                    })

                    pdcWhere = {user_id : user_id, source : "pdc" };
                    migrationWhere = {user_id : user_id, source : "gumigration"};
                    intershipwhere = {user_id : user_id, source : "guinternship" };

                    attestationWhere = "mrk.user_id = " + user_id;
                    instructionalWhere = "mrk.userId = " + user_id;
                    verificationWhere = {user_id : user_id,type:{[Op.ne] : 'secondYear'} };
                    syverificationWhere = {user_id : user_id,type:'secondYear' };
                    
                }

                if(service.includes('gumigration')){
                    var splitAppId = service.split('(');
                    migrationWhere = {user_id : user_id, app_id : splitAppId[splitAppId.length-1].split(')')[0] ,source :splitAppId[0]};
                    models.User_Enrollment_Detail.getApplicationDetailsById(splitAppId[splitAppId.length-1].split(')')[0]).then(function(migrationApp){
                      studentObject.migrationDetails.applicationDetails =  migrationApp[0];
                    })
                    
                    pdcWhere = {user_id : user_id, source : "pdc" };
                    convocationWhere = {user_id : user_id, source : "guconvocation" };
                    intershipwhere = {user_id : user_id, source : "guinternship" };

                    attestationWhere = "mrk.user_id = " + user_id;
                    instructionalWhere = "mrk.userId = " + user_id;
                    verificationWhere = {user_id : user_id,type:{[Op.ne] : 'secondYear'} };
                    syverificationWhere = {user_id : user_id,type:'secondYear' };

                }

                if(service.includes('guattestation')){
                    var splitAppId = service.split('(');

                    attestationWhere = "mrk.user_id = " + user_id +" AND mrk.app_id = " + splitAppId[splitAppId.length-1].split(')')[0];
                    instructionalWhere = "mrk.userId = " + user_id + " AND mrk.app_id = " + splitAppId[splitAppId.length-1].split(')')[0] ;
                    models.User_Course_Enrollment_Detail_Attestation.getApplicationDetailsById(splitAppId[splitAppId.length-1].split(')')[0],'attestation').then(function(attestationApp){
                      studentObject.attestationDetails.applicationDetails =  attestationApp[0];
                    })
                    
                    pdcWhere = {user_id : user_id, source : "pdc" };
            convocationWhere = {user_id : user_id, source : "guconvocation" };
            migrationWhere = {user_id : user_id, source : "gumigration"};
          intershipwhere = {user_id : user_id, source : "guinternship" };

            verificationWhere = {user_id : user_id,type:{[Op.ne] : 'secondYear'} };
            syverificationWhere = {user_id : user_id,type:'secondYear' };

                }

                if(service.includes('gumoi')){
                    var splitAppId = service.split('(');

                    attestationWhere = "mrk.user_id = " + user_id +" AND mrk.app_id = " + splitAppId[splitAppId.length-1].split(')')[0];
                    instructionalWhere = "mrk.userId = " + user_id + " AND mrk.app_id = " + splitAppId[splitAppId.length-1].split(')')[0] ;
                    models.User_Course_Enrollment_Detail_Attestation.getApplicationDetailsById(splitAppId[splitAppId.length-1].split(')')[0],'moi').then(function(attestationApp){
                      studentObject.moiDetails.applicationDetails =  attestationApp[0]
                    })

                        pdcWhere = {user_id : user_id, source : "pdc" };
                        convocationWhere = {user_id : user_id, source : "guconvocation" };
                        migrationWhere = {user_id : user_id, source : "gumigration"};
                        intershipwhere = {user_id : user_id, source : "guinternship" };

                            verificationWhere = {user_id : user_id,type:{[Op.ne] : 'secondYear'} };
                syverificationWhere = {user_id : user_id,type:'secondYear' };
                    
                }

                if(service.includes('guverification')){
                    var splitAppId = service.split('(');
                    verificationWhere = {user_id : user_id , app_id : splitAppId[splitAppId.length-1].split(')')[0],type:{[Op.ne] : 'secondYear'}};
                    verificationTWhere = {user_id : user_id , app_id : splitAppId[splitAppId.length-1].split(')')[0]};

                    models.MDT_User_Enrollment_Detail.getApplicationDetailsById(splitAppId[splitAppId.length-1].split(')')[0]).then(function(verificationApp){
                        studentObject.verificationDetails.applicationDetails =  verificationApp[0];
                    })  

                    pdcWhere = {user_id : user_id, source : "pdc" };
            convocationWhere = {user_id : user_id, source : "guconvocation" };
            migrationWhere = {user_id : user_id, source : "gumigration"};
          intershipwhere = {user_id : user_id, source : "guinternship" };

            attestationWhere = "mrk.user_id = " + user_id;
            instructionalWhere = "mrk.userId = " + user_id;
            syverificationWhere = {user_id : user_id,type:'secondYear' };
                    
                }

                if(service.includes('gusyverification')){
                    var splitAppId = service.split('(');
                    syverificationWhere = {user_id : user_id , app_id : splitAppId[splitAppId.length-1].split(')')[0],type:'secondYear'};
                   
                    models.SY_User_Enrollment_Detail.getApplicationDetailsById(splitAppId[splitAppId.length-1].split(')')[0]).then(function(syverificationApp){
                    
                        studentObject.syverificationDetails.applicationDetails =  syverificationApp[0];
                    })  

                    pdcWhere = {user_id : user_id, source : "pdc" };
            convocationWhere = {user_id : user_id, source : "guconvocation" };
            migrationWhere = {user_id : user_id, source : "gumigration"};
          intershipwhere = {user_id : user_id, source : "guinternship" };

            attestationWhere = "mrk.user_id = " + user_id;
            instructionalWhere = "mrk.userId = " + user_id;
            verificationWhere = {user_id : user_id,type:{[Op.ne] : 'secondYear'} };

                    
                }
                
                if(service.includes('guinternship')){
                    var splitAppId = service.split('(');
                    intershipwhere = {user_id :user_id, app_id : splitAppId[splitAppId.length-1].split(')')[0] ,source : splitAppId[0]};
                    
                    models.User_Course_Enrollment_Detail_Intership.getApplicationDetailsById(splitAppId[splitAppId.length-1].split(')')[0]).then(function(intershipApp){
                      studentObject.intership.applicationDetails =  intershipApp[0];
                   });

                    pdcWhere = {user_id : user_id, source : "pdc" };
            convocationWhere = {user_id : user_id, source : "guconvocation" };
            migrationWhere = {user_id : user_id, source : "gumigration"};
          
            attestationWhere = "mrk.user_id = " + user_id;
            instructionalWhere = "mrk.userId = " + user_id;
            verificationWhere = {user_id : user_id,type:{[Op.ne] : 'secondYear'} };
            syverificationWhere = {user_id : user_id,type:'secondYear' };
                        
                } 

            })
            setTimeout(()=>{resolve(true)}, 5000);
        }
    });
    servicePromise.then((result)=>{

        models.User.findOne({
            where:{
                id : user_id
            }
        }).then(function(user){
            var list =[];
            if(user.enrollmentNo){
                user.enrollmentNo.forEach(enrollment=>{
                    list +=(enrollment.enrollmentNo) ? (enrollment.enrollmentNo) :'  '
                    list +=' '+ '(' + enrollment.course + ')\n';
                })
            }
            studentObject.personalDetails.id = user.id;
            studentObject.personalDetails.firstName = user.name;
            studentObject.personalDetails.lastName = user.surname;
            studentObject.personalDetails.emailId = user.email;
            studentObject.personalDetails.mobile = user.mobile_country_code + '-' + user.mobile;
            studentObject.personalDetails.marksheetName = (user.marksheetName!=null) ? user.marksheetName : user.fullname;
            studentObject.personalDetails.gender = user.gender;
            studentObject.personalDetails.aadharNo = user.aadharNumber;
            studentObject.personalDetails.dob = user.dob;
            studentObject.personalDetails.nationality =(user.nationality) ? user.nationality : null;
            studentObject.personalDetails.category = (user.category_input) ? user.category_input : null;
            studentObject.personalDetails.subCategory = (user.sub_category) ? user.sub_category : null;
            studentObject.personalDetails.courseEnroll = list;

            let pdcPromise = new  Promise(function(resolve, reject){
                var pdc = false;
                models.edu_details.findAll({
                    where : pdcWhere
                }).then(function(pdcEduDetails){
                    if(pdcEduDetails){
                        studentObject.pdcDetails.educationDetails = pdcEduDetails;
                    }
                     models.Applicant_Marksheet.findAll({
                        where :pdcWhere
                    }).then(function(applicant_marksheet){
                        var i=0
                        if(applicant_marksheet.length > 0){
                            applicant_marksheet.forEach(marksheet=>{
                                i++
                                var extension = marksheet.file_name.split('.').pop();
                                if (marksheet.name =='Photo' || marksheet.name=='Aadhar Card' ) {
                                    docname = marksheet.name
                                }else{
                                    docname = marksheet.applied_for_degree
                                } 
                               studentObject.pdcDetails.documents.push({
                                    id: marksheet.id,
                                    name: marksheet.name,
                                    file_name: marksheet.file_name,
                                    file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    extension: extension,
                                    source: marksheet.source,
                                    docname: docname,
                                    app_id: marksheet.app_id,
                                    lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                    upload_step : (marksheet.upload_step == 'requested') ? true : false
                                });  
                            })
                        }
                     
                        setTimeout(()=>{resolve(pdc)}, 1000);
                    })
                })
            });
            
            let intershipPromise = new  Promise(function(resolve, reject){
                var intership = false;

                models.edu_details.findAll({
                    where : intershipwhere
                }).then(function(intershipEduDetails){
                    if(intershipEduDetails){
                        studentObject.intership.educationDetails = intershipEduDetails;
                    }
                    models.Applicant_Marksheet.findAll({
                        where :intershipwhere
                    }).then(function(applicant_marksheet){
                        if(applicant_marksheet.length > 0){
                            applicant_marksheet.forEach(marksheet=>{
                                var extension = marksheet.file_name.split('.').pop();
                                if (marksheet.name =='Photo' || marksheet.name=='Aadhar Card' ) {
                                    docname = marksheet.name
                                }else{
                                    docname = marksheet.applied_for_degree
                                } 
                                studentObject.intership.documents.push({
                                    id: marksheet.id,
                                    name: marksheet.name,
                                    file_name: marksheet.file_name,
                                    file: serverUrl + "upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    extension: extension,
                                    source: marksheet.source,
                                    docname: docname,
                                    app_id: marksheet.app_id,
                                    lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                    upload_step : (marksheet.upload_step == 'requested') ? true : false
                                });  
                            })
                        }
                        setTimeout(()=>{resolve(intership)}, 1000);
                    })
                })
            });

            let convocationPromise = new Promise(function(resolve, reject){
                var convocation = true;
                models.edu_details.findAll({
                    where : convocationWhere
                }).then(function(convoEduDetails){
                    if(convoEduDetails){
                        studentObject.convocationDetails.educationDetails = convoEduDetails;
                    }
                    models.Applicant_Marksheet.findAll({
                        where :convocationWhere
                    }).then(function(applicant_marksheet){
                        if(applicant_marksheet.length > 0){
                            applicant_marksheet.forEach(marksheet=>{
                                var extension = marksheet.file_name.split('.').pop();
                                if (marksheet.name =='Photo' || marksheet.name=='Aadhar Card' ) {
                                    docname = marksheet.name
                                }else{
                                    docname = marksheet.applied_for_degree
                                } 
                                studentObject.convocationDetails.documents.push({
                                    id: marksheet.id,
                                    name: marksheet.name,
                                    file_name: marksheet.file_name,
                                    file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    extension: extension,
                                    source: marksheet.source,
                                    docname: docname,
                                    app_id: marksheet.app_id,
                                    lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                    upload_step : (marksheet.upload_step == 'requested') ? true : false
                                });  
                            })
                        }
                        setTimeout(()=>{resolve(convocation)}, 1000);
                    })
                })
            });

            let migrationPromise = new Promise(function(resolve,reject){
                var migration = true;
                models.Applicant_Educational_Details.findAll({
                    where :{
                        user_id : user_id
                        
                    } ,raw:true
                }).then(function(educationalDetails){
                    if(educationalDetails){
                        studentObject.migrationDetails.educationDetails = educationalDetails;
                    }
                   models.Applicant_Marksheet.findAll({
                        where :migrationWhere
                    }).then(function(applicant_marksheet){
                        if(applicant_marksheet.length > 0){
                            applicant_marksheet.forEach(marksheet=>{
                                var extension = marksheet.file_name.split('.').pop();
                                if (marksheet.name =='Photo' || marksheet.name=='Aadhar Card' ) {
                                    docname = marksheet.name
                                }else{
                                    docname = marksheet.applied_for_degree
                                } 
                                studentObject.migrationDetails.documents.push({
                                    id: marksheet.id,
                                    name: marksheet.name,
                                    file_name: marksheet.file_name,
                                    file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    extension: extension,
                                    source: marksheet.source,
                                    docname: docname,
                                    app_id: marksheet.app_id,
                                    lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                    upload_step : (marksheet.upload_step == 'requested') ? true : false
                                });  
                            })
                        }
                        setTimeout(()=>{resolve(migration)}, 1000);
                    })
                })
            });

            let attestationPromise = new Promise(function(resolve,reject){
                var attestation = true;
                models.userMarkList.getMarksheetsDetails(attestationWhere).then(function(marksheets){
                    marksheets.forEach(marksheet=>{
                        var extension = marksheet.file_name.split('.').pop();
                        studentObject.attestationDetails.marksheetDetails.push({
                            id: marksheet.id,
                            name: marksheet.name,
                            file_name: marksheet.file_name,
                            file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                            filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                            timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                            updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                            extension: extension,
                            collegeName : marksheet.collegeName,
                            app_id: marksheet.app_id,
                            lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                            upload_step : (marksheet.upload_step == 'requested') ? true : false,
                            verify_doc : marksheet.verify_doc ? marksheet.verify_doc : false,
                            education_type  : marksheet.education_type
                        })
                    })

                    // models.Applicant_Marksheet.getUploadedBonafied(user_id,'Bonafied','').then(function(bonafied){                            
                    //     bonafied.forEach(marksheet =>{
                    //         var extension = marksheet.file_name.split('.').pop();
                    //         studentObject.attestationDetails.bonafiedDetails.push({
                    //             id: marksheet.id,
                    //             name: marksheet.name,
                    //             file_name: marksheet.file_name,
                    //             file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                    //             filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                    //             timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                    //             updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                    //             extension: extension,
                    //             app_id: marksheet.app_id,
                    //             lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                    //             upload_step : (marksheet.upload_step == 'requested') ? true : false,
                    //             verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false
                    //         })

                    //     })  
                    // })
                    models.Applicant_Marksheet.getUploadedBonafied(user_id,'Aadhar Card').then(function(aadhar){                            
                        aadhar.forEach(marksheet =>{
                            var extension = marksheet.file_name.split('.').pop();
                            studentObject.attestationDetails.bonafiedDetails.push({
                                id: marksheet.id,
                                name: marksheet.name,
                                file_name: marksheet.file_name,
                                file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                                updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                extension: extension,
                                app_id: marksheet.app_id,
                                lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                upload_step : (marksheet.upload_step == 'requested') ? true : false,
                                verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false
                            })

                        })  
                    })

                    models.User_Transcript.getTranscriptDetails(attestationWhere,'transcripts').then(function(transcripts){
                        transcripts.forEach(marksheet=>{
                            var extension = marksheet.file_name.split('.').pop();
                            studentObject.attestationDetails.transcriptDetails.push({
                                id: marksheet.id,
                                name: marksheet.name,
                                file_name: marksheet.file_name,
                                file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                                updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                extension: extension,
                                collegeName : marksheet.collegeName,
                                app_id: marksheet.app_id,
                                lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                upload_step : (marksheet.upload_step == 'requested') ? true : false,
                                verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false,
                                type :marksheet.type ? marksheet.type : false,
                            })
                        })

                        models.User_Transcript.getTranscriptDetails(attestationWhere,'thesis').then(function(transcripts){
                            transcripts.forEach(marksheet=>{
                                var extension = marksheet.file_name.split('.').pop();
                                studentObject.attestationDetails.transcriptDetails.push({
                                    id: marksheet.id,
                                    name: marksheet.name,
                                    file_name: marksheet.file_name,
                                    file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                                    updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                    extension: extension,
                                    collegeName : marksheet.collegeName,
                                    app_id: marksheet.app_id,
                                    lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                    upload_step : (marksheet.upload_step == 'requested') ? true : false,
                                    verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false,
                                    type :marksheet.type ? marksheet.type : false,
                                })
                            })

                            models.User_Transcript.getTranscriptDetails(attestationWhere,'degree').then(function(transcripts){
                                transcripts.forEach(marksheet=>{
                                    var extension = marksheet.file_name.split('.').pop();
                                    studentObject.attestationDetails.convocationDetails.push({
                                        id: marksheet.id,
                                        name: marksheet.name,
                                        file_name: marksheet.file_name,
                                        file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                        filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                        timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        extension: extension,
                                        collegeName : marksheet.collegeName,
                                        app_id: marksheet.app_id,
                                        lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                        upload_step : (marksheet.upload_step == 'requested') ? true : false,
                                        verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false,
                                        type :marksheet.type ? marksheet.type : false,
                                        provisional  : marksheet.provisional  ? 'Provisional Degree Certificate'  : 'Degree Certificate',
                                        provisionalType : marksheet.provisional ? marksheet.provisional : 0,
                                        degree_Type  : marksheet.degreeType  ? marksheet.degreeType  : ''
                                    })
                                })    

                            models.InstructionalDetails.getInstructionalDetails(instructionalWhere).then(function(instructional){
                                instructional.forEach(instruction=>{
                                    studentObject.attestationDetails.instructionalDetails.push({
                                        id: instruction.id,
                                        studentName: instruction.studentName,
                                        courseName: instruction.courseName,
                                        collegeName: instruction.collegeName,
                                        duration: instruction.duration,
                                        division: instruction.division,
                                        yearofpassing: instruction.yearofpassing,
                                        specialization: instruction.specialization,
                                        instruction_medium : instruction.instruction_medium,
                                        academicYear : instruction.academicYear,
                                        education : instruction.education,
                                        yearofenrollment : instruction.yearofenrollment,
                                        lock_transcript : (instruction.lock_transcript == 'requested') ? true : false,
                                        app_id : instruction.app_id,
                                        verify_doc : instruction.verify_doc,
                                        Course_part:instruction.Course_part,
                                        seatNo : instruction.seat_no,
                                        intership : instruction.internship,
                                        diff_col_one:instruction.diff_col_one,
                                        diff_col_two : instruction.diff_col_two,
                                        year_attend_one: instruction.year_attend_one,
                                        year_attend_two : instruction.year_attend_two,
                                        faculty_cource : instruction.new_course_faculty,
                                        student_college_type:instruction.student_college_type,
                                            userId : instruction.userId
        
                                    })
                                })

                                models.Institution_details.getInstituteData(user_id).then(function(institution){
                                    institution.forEach(institution=>{
                                        if(institution.type == 'study'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.studyrefno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                institution_name: institution.university_name ? institution.university_name :  'N.A',
                                                contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                                                country_name: institution.country_name ? institution.country_name :  'N.A',
                                                contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                        if(institution.type == 'employment'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.emprefno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                institution_name: institution.university_name ? institution.university_name :  'N.A',
                                                contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                                                country_name: institution.country_name ? institution.country_name :  'N.A',
                                                contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                        if(institution.type == 'IQAS'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.iqasno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'CES'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.cesno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'ICAS'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.icasno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'visa'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.visarefno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                institution_name: institution.university_name ? institution.university_name :  'N.A',
                                                contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                                                country_name: institution.country_name ? institution.country_name :  'N.A',
                                                contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'

                                            })
                                        }
                                            
                                        if(institution.type == 'MYIEE'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.myieeno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'ICES'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.icesno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'NASBA'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.nasbano,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'Educational Perspective'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.eduperno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'NCEES'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.nceesno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'NARIC'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.naricno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
    
                                        if(institution.type == 'National Committee on Accreditation'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.ncano,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                        if(institution.type == 'The National Dental Examining Board of Canada'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.ndebno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'Educational credential evaluators WES'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.wesno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.emailAsWes ? institution.emailAsWes :  'N.A',
                                                NameasWes:institution.nameaswes ,
                                                Surnameaswe:institution.lastnameaswes,
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                        if(institution.type == 'HRD'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.hrdno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                        if(institution.type == 'CAPR'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.caprno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                        if(institution.type == 'dembassy'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.dembassyno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }  
                                             if(institution.type == 'Educational Credential Evaluators (ECE)'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.ecerefno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        } 
                                            
                                        if(institution.type == 'others'){
                                            studentObject.attestationDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.otheraccno ? institution.otheraccno : 'N.A',
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                institution_name: institution.university_name ? institution.university_name :  'N.A',
                                                contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                                                country_name: institution.country_name ? institution.country_name :  'N.A',
                                                contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                                                noofcopies: institution.noofcopies ? institution.noofcopies :  'N.A'
                                            })
                                        }
                                            
                                    })
                                })
                                models.dubaiembassy.getdubaiembassyData(user_id).then(function(dubaiembassydetails){
                                    dubaiembassydetails.forEach(dubaiembassydetails=>{
                                            studentObject.attestationDetails.dubaiembassy.push({
                                                id:dubaiembassydetails.id,
                                                app_id:dubaiembassydetails.app_id,
                                                user_id:dubaiembassydetails.user_id,
                                                courseName : dubaiembassydetails.courseName ? dubaiembassydetails.courseName :  'N.A',
                                                passingyear : dubaiembassydetails.passingyear ? dubaiembassydetails.passingyear :  'N.A',
                                                name : dubaiembassydetails.name ? dubaiembassydetails.name :  'N.A',
                                                type : dubaiembassydetails.type ? dubaiembassydetails.type :  'N.A',
                                                convocationDate : dubaiembassydetails.convocationDate ? dubaiembassydetails.convocationDate :  'N.A',
                                                result : dubaiembassydetails.result ? dubaiembassydetails.result :  'N.A',
                                                courseType : dubaiembassydetails.courseType ? dubaiembassydetails.courseType :  'N.A',
                                                seatNo : dubaiembassydetails.seatNo ? dubaiembassydetails.seatNo :  'N.A',
                                                purposeType: dubaiembassydetails.purposeType ? dubaiembassydetails.purposeType :  'N.A',
                                                enrollmentYear : dubaiembassydetails.enrollmentYear ? dubaiembassydetails.enrollmentYear :  'N.A',
                                                collegeName : dubaiembassydetails.collegeName ? dubaiembassydetails.collegeName :  'N.A'
                                            })
                                    })
                                })
                            })
                        })
                        })

                        
                    })
                })
                setTimeout(()=>{resolve(attestation)}, 1000);
            });

            let moiPromise = new Promise(function(resolve,reject){
                var attestation = true;
                models.userMarkList.getMarksheetsDetails(attestationWhere).then(function(marksheets){
                    marksheets.forEach(marksheet=>{
                        var extension = marksheet.file_name.split('.').pop();
                        studentObject.moiDetails.marksheetDetails.push({
                            id: marksheet.id,
                            name: marksheet.name,
                            file_name: marksheet.file_name,
                            file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                            filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                            timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                            updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                            extension: extension,
                            collegeName : marksheet.collegeName,
                            app_id: marksheet.app_id,
                            lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                            upload_step : (marksheet.upload_step == 'requested') ? true : false,
                            verify_doc : marksheet.verify_doc ? marksheet.verify_doc : false,
                            education_type  : marksheet.education_type
                        })
                    })

                    models.Applicant_Marksheet.getUploadedBonafied(user_id,'Bonafied').then(function(bonafied){                            
                        bonafied.forEach(marksheet =>{  
                            var extension = marksheet.file_name.split('.').pop();
                            studentObject.moiDetails.bonafiedDetails.push({
                                id: marksheet.id,
                                name: marksheet.name,
                                file_name: marksheet.file_name,
                                file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                                updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                extension: extension,
                                app_id: marksheet.app_id,
                                lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                upload_step : (marksheet.upload_step == 'requested') ? true : false,
                                verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false,
                                source : marksheet.source
                            })

                        })  
                    })
                    models.Applicant_Marksheet.getUploadedBonafied(user_id,'Aadhar Card').then(function(aadhar){                            
                        aadhar.forEach(marksheet =>{
                            var extension = marksheet.file_name.split('.').pop();
                            studentObject.moiDetails.bonafiedDetails.push({
                                id: marksheet.id,
                                name: marksheet.name,
                                file_name: marksheet.file_name,
                                file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                                updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                extension: extension,
                                app_id: marksheet.app_id,
                                lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                upload_step : (marksheet.upload_step == 'requested') ? true : false,
                                verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false,
                                source : marksheet.source
                            })

                        })  
                    })

                    models.User_Transcript.getTranscriptDetails(attestationWhere,'transcripts').then(function(transcripts){
                        transcripts.forEach(marksheet=>{
                            var extension = marksheet.file_name.split('.').pop();
                            studentObject.moiDetails.transcriptDetails.push({
                                id: marksheet.id,
                                name: marksheet.name,
                                file_name: marksheet.file_name,
                                file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                                updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                extension: extension,
                                collegeName : marksheet.collegeName,
                                app_id: marksheet.app_id,
                                lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                upload_step : (marksheet.upload_step == 'requested') ? true : false,
                                verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false
                            })
                        })

                        models.User_Transcript.getTranscriptDetails(attestationWhere,'degree').then(function(transcripts){
                            transcripts.forEach(marksheet=>{
                                var extension = marksheet.file_name.split('.').pop();
                                studentObject.moiDetails.convocationDetails.push({
                                    id: marksheet.id,
                                    name: marksheet.name,
                                    file_name: marksheet.file_name,
                                    file: serverUrl + "/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    filepath: FILE_LOCATION + "public/upload/documents/" + marksheet.user_id + "/" + marksheet.file_name,
                                    timestamp: moment(new Date(marksheet.created_at)).format("DD-MM-YYYY hh:mm a"),
                                    updated_at: moment(new Date(marksheet.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                    extension: extension,
                                    collegeName : marksheet.collegeName,
                                    app_id: marksheet.app_id,
                                    lock_transcript : (marksheet.lock_transcript == 'requested') ? true : false,
                                    upload_step : (marksheet.upload_step == 'requested') ? true : false,
                                    verify_doc :marksheet.verify_doc ? marksheet.verify_doc : false
                                })
                            })



                            models.InstructionalDetails.getInstructionalDetails(instructionalWhere).then(function(instructional){
                                instructional.forEach(instruction=>{
                                    studentObject.moiDetails.instructionalDetails.push({
                                        id: instruction.id,
                                        studentName: instruction.studentName,
                                        courseName: instruction.courseName,
                                        collegeName: instruction.collegeName,
                                        duration: instruction.duration,
                                        division: instruction.division,
                                        yearofpassing: instruction.yearofpassing,
                                        specialization: instruction.specialization,
                                        instruction_medium : instruction.instruction_medium,
                                        instruction_medium_two : instruction.instruction_medium_two,
                                        academicYear : instruction.academicYear,
                                        education : instruction.education,
                                        yearofenrollment : instruction.yearofenrollment,
                                        lock_transcript : (instruction.lock_transcript == 'requested') ? true : false,
                                        app_id : instruction.app_id,
                                        verify_doc : instruction.verify_doc,
                                        Course_part:instruction.Course_part,
                                        seatNo : instruction.seat_no,
                                        intership : instruction.internship,
                                        diff_col_one:instruction.diff_col_one,
                                        diff_col_two : instruction.diff_col_two,
                                        year_attend_one: instruction.year_attend_one,
                                        year_attend_two : instruction.year_attend_two,
                                        faculty_cource : instruction.new_course_faculty,
                                        student_college_type:instruction.student_college_type,  
                                        current_year :instruction.current_year ,
                                        diplomaHolder :instruction.diplomaHolder,
                                         userId : instruction.userId

                                    })
                                })

                                models.Institution_details.getInstituteData(user_id).then(function(institution){
                                    institution.forEach(institution=>{
                                        if(institution.source == 'gumoi'){
                                        if(institution.type == 'study'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.studyrefno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                institution_name: institution.university_name ? institution.university_name :  'N.A',
                                                contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                                                country_name: institution.country_name ? institution.country_name :  'N.A',
                                                contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                                            })
                                        }
                                        if(institution.type == 'employment'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.emprefno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                institution_name: institution.university_name ? institution.university_name :  'N.A',
                                                contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                                                country_name: institution.country_name ? institution.country_name :  'N.A',
                                                contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                                            })
                                        }
                                        if(institution.type == 'IQAS'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.iqasno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'CES'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.cesno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'ICAS'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.icasno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'visa'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.visarefno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                institution_name: institution.university_name ? institution.university_name :  'N.A',
                                                contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                                                country_name: institution.country_name ? institution.country_name :  'N.A',
                                                contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                                            })
                                        }
                                            
                                        if(institution.type == 'MYIEE'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.myieeno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'ICES'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.icesno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'NASBA'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.nasbano,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'Educational Perspective'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.eduperno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'NCEES'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.nceesno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'NARIC'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.naricno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
    
                                        if(institution.type == 'National Committee on Accreditation'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.ncano,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                        if(institution.type == 'The National Dental Examining Board of Canada'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.ndebno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'Educational credential evaluators WES'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.wesno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                NameasWes:institution.nameaswes,
                                                Surnameaswe:institution.lastnameaswes 
                                            })
                                        }
                                        if(institution.type == 'HRD'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.hrdno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }

                                        if(institution.type == 'CAPR'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.caprno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }
                                            
                                        if(institution.type == 'others'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.otheraccno ? institution.otheraccno : 'N.A.',
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A',
                                                institution_name: institution.university_name ? institution.university_name :  'N.A',
                                                contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                                                country_name: institution.country_name ? institution.country_name :  'N.A',
                                                contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                                            })
                                        }
                                        if(institution.type == 'Educational Credential Evaluators (ECE)'){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type,
                                                referenceNo : institution.ecerefno,
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }

                                        if(institution.type == 'pickup' || institution.type == '' ){
                                            studentObject.moiDetails.purpose.push({
                                                id:institution.id,
                                                app_id:institution.app_id,
                                                type : institution.type ? institution.type:'Pickup',
                                                referenceNo : 'N.A.',
                                                deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                                                deliveryAddress :  institution.address ? institution.address : 'N.A',
                                                email  : institution.email ? institution.email :  'N.A'
                                            })
                                        }                           
                                            
                                 }
                                 })
                                    })
                        })
                        })
                    })
                })
                setTimeout(()=>{resolve(attestation)}, 1000);
            });

            let verificationPromise = new Promise(function(resolve,reject){
                var verification = true;
                models.VerificationTypes.findOne({
                    where:verificationTWhere
                }).then(function(verificationTypes){
                    studentObject.verificationDetails.documentDetails = verificationTypes;
                    models.DocumentDetails.findAll({
                        where :verificationWhere
                    }).then(function(documentDetails){
                        if(documentDetails.length > 0){
                            documentDetails.forEach(document=>{
                                var extension = (document.file) ? document.file.split('.') : null;
                                if (document.type == 'marksheet') {
                                    var academicYear ;
                                    var mbaCheck = false;
                                    var mbaCourse = false;
                                    if((document.courseName.includes('Master of Business Administration')||
                                    document.courseName.includes('Master in Business Administration')) && 
                                    (document.semester == 'Second Year'||
                                    document.semester == 'Semester IV')){
                                        studentObject.verificationDetails.mbaCourse = true;
                                        var passingYear = moment(new Date(document.PassingMonthYear)).format('YYYY');
                                        if(passingYear >=1995 && passingYear <=2003){
                                            academicYear = moment(new Date(document.enrollmentStart)).format('YYYY') + ' - ' + moment(new Date(document.enrollmentEnd)).format('YYYY');
                                            mbaCheck = true;
                                        }
                                        
                                    }
                                    studentObject.verificationDetails.marksheetDetails.push({
                                        id: document.id,
                                        userid: document.user_id,
                                        app_id: document.app_id,
                                        courseName: document.courseName,
                                        courseType:document.courseType,
                                        seatNo: document.seatNo,
                                        passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                                        collegeName : document.collegeName,
                                        result : document.resultClass,
                                        semester : document.semester,
                                        fileName: document.file,
                                        type:document.type,
                                        fileSrc: serverUrl + '/upload/documents/' + user_id + '/' + document.file,
                                        filepath: FILE_LOCATION + "public/upload/documents/" + user_id + "/" + document.file,
                                        timestamp: moment(new Date(document.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(document.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        courseType:document.courseType,
                                        fileExtension: (extension) ? extension[1] : null,
                                        lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                                        upload_step: (document.upload_step == 'requested') ? true : false,
                                        verify_doc :document.verify_doc,
                                        academicYear : academicYear,
                                        enrollmentStart : document.enrollmentStart,
                                        enrollmentEnd : document.enrollmentEnd,
                                        majorSubject : document.majorSubject,
                                        totalGrade : document.totalGrade,
                                        avgGrade : document.avgGrade,
                                        mbaCheck : mbaCheck,

                                })
                                } else if (document.type == 'transcript') {
                                    studentObject.verificationDetails.transcriptDetails.push({
                                        id: document.id,
                                        userid: document.user_id,
                                        app_id: document.app_id,
                                        courseName: document.courseName,
                                        courseType:document.courseType,
                                        seatNo: document.seatNo,
                                        collegeName : document.collegeName,
                                        result : document.resultClass,
                                        courseType:document.courseType,
                                        passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                                        fileName: document.file,
                                        fileSrc: serverUrl + '/upload/documents/' + user_id + '/' + document.file,
                                        filepath: FILE_LOCATION + "public/upload/documents/" + user_id + "/" + document.file,
                                        timestamp: moment(new Date(document.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(document.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        fileExtension: (extension) ? extension[1] : null,
                                        lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                                        upload_step: (document.upload_step == 'requested') ? true : false,
                                        verify_doc :document.verify_doc,
                                        type:document.type,
                                    })
                                } else if (document.type == 'degree') {
                                    models.Program_List.findOne({
                                        where:{
                                            course_name : document.courseName
                                        }
                                    }).then(async function(courseList){
                                        var icc_upload = false;
                                        if(document.degree_Type != 'Internship Completion Certificate'){
                                            await models.DocumentDetails.findAll({
                                                where:{
                                                    courseName : document.courseName,
                                                    app_id : document.app_id,
                                                    user_id : document.user_id,
                                                    degree_Type : "Internship Completion Certificate"
                                                }
                                            }).then(function(icc_deg_details){
                                                if(icc_deg_details.length > 0){
                                                    icc_upload = true;
                                                }
                                            })
                                        }
                                        studentObject.verificationDetails.degreeDetails.push({
                                            id: document.id,
                                            courseName: document.courseName,
                                            seatNo: document.seatNo,
                                            userid: document.user_id,
                                            app_id: document.app_id,
                                            collegeName : document.collegeName,
                                            courseType:document.courseType,
                                            result : document.resultClass,
                                            convocationDate:document.convocationDate,
                                            passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                                            fileName: document.file,
                                            fileSrc: serverUrl + '/upload/documents/' + user_id + '/' + document.file,
                                            filepath: FILE_LOCATION + "public/upload/documents/" + user_id + "/" + document.file,
                                            timestamp: moment(new Date(document.created_at)).format("DD-MM-YYYY hh:mm a"),
                                            updated_at: moment(new Date(document.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                            fileExtension: (extension) ? extension[1] : null,
                                            lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                                            upload_step: (document.upload_step == 'requested') ? true : false,
                                            verify_doc :document.verify_doc,
                                            type:document.type,
                                            degree_Type:document.degree_Type,
                                            internship : courseList.internship,
                                            icc_upload : icc_upload
                                        })
                                    })
                                } else if(document.type =='supportive'){
                                    studentObject.verificationDetails.supportiveDetails.push({
                                        id: document.id,
                                        userid: document.user_id,
                                        app_id: document.app_id,
                                        courseName: document.courseName,
                                        semester : document.semester,
                                        fileName: document.file,
                                        timestamp: moment(new Date(document.created_at)).format("DD-MM-YYYY hh:mm a"),
                                        updated_at: moment(new Date(document.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                        fileSrc: serverUrl + '/upload/documents/' + user_id + '/' + document.file,
                                        filepath: FILE_LOCATION + "public/upload/documents/" + user_id + "/" + document.file,
                                        fileExtension: (extension) ? extension[1] : null,
                                        type:document.type,
                                    })
                                }
                            })

                            models.InstituteDetails.findAll({
                                where : verificationWhere
                            }).then(function(instituteDetails){
                                studentObject.verificationDetails.instituteDetails = instituteDetails;
                            })
                        }
                    })
                })
                setTimeout(()=>{resolve(verification)}, 1000);
            });

            let syverificationPromise = new Promise(function(resolve,reject){
                var syverification = true;
                models.DocumentDetails.findAll({
                    where :syverificationWhere
                }).then(function(documentDetails){
                        documentDetails.forEach(document=>{
                            if(document.file == '' || document.file == null){
                                var extension = ''
                            }else{
                                var extension = document.file.split('.');
                            }
                            if (document.type == 'secondYear') {
                                studentObject.syverificationDetails.secondYearDetails.push({
                                    id: document.id,
                                    userid: document.user_id,
                                    app_id: document.app_id,
                                    courseName: document.courseName,
                                    seatNo: document.seatNo,
                                    majorSubject : document.majorSubject,
                                    subsidarySubject : document.subsidarySubject,
                                    enrollmentStart : moment(new Date(document.enrollmentStart)).format('MMM YYYY'),
                                    enrollmentEnd : moment(new Date(document.enrollmentEnd)).format('MMM YYYY'),
                                    passingMonthYear: moment(new Date(document.PassingMonthYear)).format('MMM YYYY'),
                                    collegeName : document.collegeName,
                                    result : document.resultClass,
                                    semester : document.semester,
                                    fileName: document.file,
                                    fileSrc: serverUrl + '/upload/documents/' + user_id + '/' + document.file,
                                    filepath: FILE_LOCATION + "public/upload/documents/" + user_id + "/" + document.file,
                                    timestamp: moment(new Date(document.created_at)).format("DD-MM-YYYY hh:mm a"),
                                    updated_at: moment(new Date(document.updated_at)).format("DD-MM-YYYY hh:mm a"),
                                    fileExtension: extension[1],
                                    lock_transcript: (document.lock_transcript == 'requested') ? true : false,
                                    upload_step: (document.upload_step == 'requested') ? true : false,
                                    verify_doc :document.verify_doc,
                                    type : document.type,
                                    presubsidarySubject : document.presubsidarySubject
    
                                })
                            } 
                        })
                    models.InstituteDetails.findAll({
                        where : syverificationWhere
                    }).then(function(instituteDetails){
                        studentObject.syverificationDetails.instituteDetails = instituteDetails;
                    })
                })
                setTimeout(()=>{resolve(syverification)}, 1000);
            });
            
            Promise.all([pdcPromise,convocationPromise,migrationPromise,attestationPromise,verificationPromise,syverificationPromise,moiPromise,intershipPromise
]).then((values)=>{
            res.json({
                    status : 200,
                    data : studentObject
                })
            })

        })        
    })

})

router.post('/colornagnge', (req, res) => {
    var app_id=req.body.app_id
    var value=req.body.value
    models.Application.update({
        status:value
    },{
        where:{
            id:app_id,
            source_from:req.body.source
        }
    }).then(function(data){
        if(data.length>0){
            var desc = "Tracker  for" + app_id + " is updated to " + value  + " by "+  req.user.email;
            var activity = "Tracker Update";
            functions.activitylog(req,'', activity, desc, app_id, 'guAdmin');
        }

        res.json({
            status: 200,
        })
    })
})

router.get('/downloadDocuments',function (req, res) {
    const downloadData =  req.query.documentFile;
    res.download(downloadData);
});

router.post('/updateStudentDetails',(req,res)=>{
    var user_id = req.body.userId;
    var personalDetails = req.body.personalDetails;
    models.User.findOne({
        where :{
            id : user_id
        }
    }).then(function(user){
        if(user){
            var dob = (personalDetails.dob) ? (personalDetails.dob) : user.dob;
            var firstName = (personalDetails.firstName) ? (personalDetails.firstName) : user.name;
            var surname = (personalDetails.lastName) ? (personalDetails.lastName) : user.surname;
            var mobile_country_code = (personalDetails.mobile_country_code) ? (personalDetails.mobile_country_code) : user.mobile_country_code;
            var mobile = (personalDetails.mobile) ? (personalDetails.mobile) : user.mobile;
            var marksheetName = (personalDetails.marksheetName) ? (personalDetails.marksheetName) : user.marksheetName;
            var aadharNumber = (personalDetails.aadharNo) ? (personalDetails.aadharNo) : user.aadharNumber;
            var nationality = (personalDetails.nationality) ? (personalDetails.nationality) : user.nationality;
            var category = (personalDetails.category) ? (personalDetails.category) : user.category;
            var sub_category = (personalDetails.subCategory) ? (personalDetails.subCategory) : user.sub_category;
            user.update({
                name : firstName,
                surname : surname,
                mobile_country_code : mobile_country_code,
                mobile : mobile,
                marksheetName : marksheetName,
                fullname : marksheetName,
                dob : dob,
                aadharNumber : aadharNumber,
                nationality : nationality,
                category : category,
                sub_category :sub_category
            }).then(function(user){
                if(user){
                    var desc = "Student details updated successfully for "+ user_id+"by "+  req.user.email;
                    var activity = "Student details updated";
                    functions.activitylog(req,user_id, activity, desc, req.body.id, 'guAdmin');
                    res.json({
                        status : 200,
                        message : "User data saved successfully"
                    })
                }
            })
        }
    })
// cron.schedule('0 10 * * *', () => {
    cron.schedule('33 14 * * *',() => {
        var yesterday1 = moment().subtract(1, 'days').startOf('day');
        var mergeStringMig = '';
        var yesterdayNew  = yesterday1.format('YYYY-MM-DD');
        var dir = serverUrl+"/upload/merge_files/migration/"+yesterday1
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        };
        var outputString = '"'+serverUrl+"/upload/merge_files/migration/"+yesterday1+"/print_date_"+yesterday1+"_MIG.pdf"
        var query =  "Select * from Application where tracker = 'print' and source_from = 'gumigration'";
            connection.query(query,
                async function(err,result,fields){
                    if(result){
                        result.forEach(app=>{
                            var source_from = app.source_from;
                            var app_id = app.id;
                            var user_id = app.user_id;
                            mergeStringMig = mergeStringMig+' "'+serverUrl+"/upload/transcript/"+user_id+'/'+app_id+'_migration_certificate.pdf'+'"'; 
                    });
                    setTimeout(()=>{
                        functions.merge(mergeStringMig,outputString);
                    },2500)

                    
                    }
                })

    })

})

router.post('/setApplicationErrata',(req,res)=>{
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var event = req.body.event;
    var id = req.body.id;
    var user_id = req.body.user_id;
    var type = req.body.type;
    var message = req.body.message;
    var source_from = req.body.source;
    var app_id = req.body.app_id;
    var errataType = req.body.errataType;
    var whicherrata = req.body.whicherrata;

   if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/setApplicationErrata',{json:{"id" : id, "event" : event, "app_id":app_id,"user_id":user_id,"type":type,"message" : message,"email_admin":req.user.email,"source_from":source_from,"clientIP": clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/setApplicationErrata',{json:{"id" : id, "event" : event, "app_id":app_id,"user_id":user_id,"type":type,"message" : message,"email_admin":req.user.email,"source_from":source_from,"clientIP": clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }
    else if(source_from == 'guconvocation' ) {
        request.post(CONVOCATION_BASE_URL+'/setErrata',{json:{"app_id":app_id,"docid":id,"type":type, notes : message,"email_admin":req.user.email,"clientIP": clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application errata Successfullly..'
                    })
                }
            }
        })
    } 
     else if(source_from == 'pdc' ) {
        request.post(PDC_BASE_URL+'/setErrata',{json:{"app_id":app_id,"docid":id,"type":type, notes : message,"email_admin":req.user.email,"clientIP": clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application errata Successfullly..'
                    })
                }
            }
        })
    }
    else if(source_from == 'guinternship' ) {
      request.post(intership_BASE_URL+'/setErrata',{json:{"app_id":app_id,"docid":id,"type":type, notes : message,"email_admin":req.user.email,"clientIP": clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application errata Successfullly..'
                    })
                }
            }
        })
    }
    else if(source_from == 'gumigration') {
        if(type == 'education'){
            request.post(MIGRATION_BASE_URL+'/admin/adminDashboard/lockUnlockEdu',{json:{"app_id":app_id,"docid":id,"type":type,"notes" : message,"email_admin":req.user.email,"outward":req.body.outward,"clientIP": clientIP}},
            function(error, response, VERIFY){
                if(error){
                }else{
                    if(VERIFY.status == 200){
                        res.json({
                            status:200,
                            message:'Application Verified Successfullly..'
                        })
                    }
                }
            })
        }else if(type == 'document'){
            var msg_from_admin_data ={
            userId : user_id,
            message: message,
            doc_id : id,
            errata_data : []
          }
            request.post(MIGRATION_BASE_URL+'/admin/adminDashboard/trans_sendmessage',{json:{"msg":msg_from_admin_data,"email_admin":req.user.email,"clientIP": clientIP}},
            function(error, response, VERIFY){
                if(error){
                }else{
                    if(VERIFY.status == 200){
                        res.json({
                            status:200,
                            message:'Application Verified Successfullly..'
                        })
                    }
                }
            })
        }

        
    }else if(source_from.includes('guattestation')) {
      

        request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/trans_sendmessage', {json:{"app_id" : app_id, "user_id" : user_id, "usermarklist_id" : id,"message" : message,"email_admin":req.user.email,"type" : type ,"errataType" :errataType,"clientIP": clientIP,"whicherrata" :whicherrata}},
        function(error, response, VERIFY){
            
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }else if(source_from.includes('gumoi')) {
      

        request.post(MOI_BASE_URL+'/admin/adminDashboard/trans_sendmessage', {json:{"app_id" : app_id, "user_id" : user_id, "usermarklist_id" : id,"message" : message,"email_admin":req.user.email,"type" : type ,"errataType" :errataType,"clientIP": clientIP ,"whicherrata" : whicherrata}},
        function(error, response, VERIFY){
            
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        message:'Application Verified Successfullly..'
                    })
                }
            }
        })
    }
 
    
})

router.get('/getapplication', (req, res) => {
    models.Application.findAll({
        where: {
            id: req.query.id
        }
    }).then(function (appdata) {
        if (appdata.length > 0) {
            res.json({
                status: 200,
                data: appdata
            })
        }
    })
})

router.post('/setErrata', async (req, res) => {
    var app_id = req.body.app_id
    var notes = req.body.notes
    var docid = req.body.docid;
    var type = req.body.type
    if (type == 'document') {
        let data = await fetchmarkseet(docid, app_id);
        if (data) {
            var id = data.id
            let updatedoc1 = await updatedoc(id, 'requested', '1', notes)
            if (updatedoc1) {
                var id = updatedoc1.app_id
                let upedu = await updateapplication(id, 'requested', 'pdc')
                if (upedu) {
                    let user = await getuser(updatedoc1.user_id)
                    if (user) {
                        request.post(BASE_URL_SENDGRID + 'eduerrata', {
                            json: {
                                notes: notes,
                                source: 'pdc',
                                email: user[0].email,
                                name: user[0].fullname,
                                app_id: app_id,
                                status: 'document'
                            }
                        }, function (error, response, body) {
                            res.json({
                                status: 200
                            })
                        });
                    }

                }
            }
        }

    } else if (type == 'education') {
        let data = await fetchedudetail(app_id);
        if (data) {
            var id = data.id
            let updateedudetail = await updatedu(id, '1', notes)
            if (updateedudetail) {
                var id = updateedudetail.app_id
                let upedu = await updateapplication(id, 'requested', 'pdc')
                if (upedu) {
                    let user = await getuser(updateedudetail.user_id)
                    if (user) {
                        request.post(BASE_URL_SENDGRID + 'eduerrata', {
                            json: {
                                notes: notes,
                                source: 'pdc',
                                email: user[0].email,
                                name: user[0].fullname,
                                app_id: app_id,
                                status: 'education'
                            }
                        }, function (error, response, body) {
                            res.json({
                                status: 200
                            })
                        });
                    }

                }
            }


        }

    } else if (type == 'notes') {
        models.Application.update({
            notes: notes
        }, {
            where: {
                id: app_id
            }
        }).then(function (data) {
            if (data > 0) {
                models.Application.findOne({
                    where:{
                        id : app_id
                    }
                }).then(function(application){
                    var desc = "Note of application " + app_id + " is updated by " + req.user.email;
                    var activity = "Note Updated";
                    functions.activitylog(req,application.user_id, activity, desc, app_id, 'guAdmin');
                    res.json({
                        status: 200

                    })
                })
            } else {
                res.json({
                    status: 400
                })
            }

        })
    }

})

/*  Author : Priyanka Divekar
Route : Generate and download application form
Paramater : user id and application id*/

router.get('/generatepdfform',  (req,res,next)=>{
    var user_id = req.query.user_id;
    var app_id = req.query.app_id;
    var source_from = req.query.source_from;
    if(source_from == 'guverification'){
        request.post(VERIFY_BASE_URL+'/application/generatepdfform',{json:{"app_id": app_id,'user_id' : user_id ,'email_admin' : req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['data']
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.post(SY_VERIFY_BASE_URL+'/application/generatepdfform',{json:{"app_id": app_id,'user_id' : user_id ,'email_admin' : req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['data']
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation') {
        request.post(CONVOCATION_BASE_URL+'/application/generatepdfform',{json:{"app_id": app_id,'userId' : user_id ,'email_admin' : req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['data']
                    })
                }
            }
        })
    }else if(source_from == 'pdc') {
        request.post(PDC_BASE_URL+'/generatepdfform',{json:{"app_id": app_id,'userId' : user_id ,'email_admin' : req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['data']
                    })
                }
            }
        })
    }else if(source_from == 'gumigration') {
        request.get(MIGRATION_BASE_URL+'/signpdf/printApplication?user_id='+user_id,
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['data']
                    })
                }
            }
        })
    }else if(source_from == 'guattestation') {
        request.post(ATTESTATION_BASE_URL+'/attestation/downloadForm?',{json:{"application_id" : app_id, "user_id" : user_id, "email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['path'],
                        fileName : VERIFY['fileName'],
                    })
                }
            }
        })
    }else if(source_from == 'gumoi') {
        request.post(MOI_BASE_URL+'/attestation/downloadForm?',{json:{"application_id" : app_id, "user_id" : user_id, "email_admin":req.user.email}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['path'],
                        fileName : VERIFY['fileName'],
                    })
                }
            }
        })
    }
    
})

/*  Author : Priyanka Divekar
Route : Merge uploaded documentsand download 
Paramater : user id and application id*/

router.get('/mergeDocuments',  (req,res,next)=>{
    var user_id = req.query.user_id;
    var app_id = req.query.app_id;
    var source_from = req.query.source_from;
    if(source_from == 'guverification'){
        request.get(VERIFY_BASE_URL+'/payment/mergeDocuments?app_id=' + app_id+ '&user_id=' + user_id + '&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
               var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data:data.data
                    })
                }
            }
        })
    }else if(source_from == 'gusyverification'){
        request.get(SY_VERIFY_BASE_URL+'/payment/mergeDocuments?app_id=' + app_id+ '&user_id=' + user_id + '&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data:data.data
                    })
                }
            }
        })
    }else if(source_from == 'guconvocation') {
        request.get(CONVOCATION_BASE_URL+'/mergeAllUserDocuments?app_id=' + app_id,'&user_id=' + user_id,'&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['data']
                    })
                }
            }
        })
    }else if(source_from == 'pdc') {
        request.get(PDC_BASE_URL+'/mergeAllUserDocuments?app_id=' + app_id,'&user_id=' + user_id, + '&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['data']
                    })
                }
            }
        })
    }else if(source_from == 'gumigration') {
        request.get(MIGRATION_BASE_URL+'/mergeAllUserDocuments?app_id=' + app_id,'&user_id=' + user_id,'&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    res.json({
                        status:200,
                        data:VERIFY['data']
                    })
                }
            }
        })
    }
    else if(source_from == 'guattestation') {
        request.get(ATTESTATION_BASE_URL+'/signpdf/mergeAllUserDocuments?app_id=' + app_id + '&user_id=' + user_id + '&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data:data.data
                    })
                }
            }
        })
    }else if( source_from == 'gumoi') {
        request.get(MOI_BASE_URL+'/signpdf/mergeAllUserDocuments?app_id=' + app_id+'&user_id=' + user_id, + '&email_admin=' + req.user.email,
        function(error, response, VERIFY){
            if(error){
            }else{
                var data = JSON.parse(VERIFY);
                if(data.status == 200){
                    res.json({
                        status:200,
                        data:data.data
                    })
                }
            }
        })
    }

})

router.get('/getFileDetails', (req,res,next) => {
    let fpath = serverUrl+"/upload/documents/"+req.query.user_id+'/'+req.query.app_id+'_Merge.pdf'
    let fullpath = FILE_LOCATION+"public/upload/documents/"+req.query.user_id+'/'+req.query.app_id+'_Merge.pdf'
    res.json({
        status:200,
        data:fpath,
        fullpath:fullpath,
        extension:'pdf'
    })
})

router.post('/saveOutward', async (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var app_id = req.body.app_id
    var source = req.body.source
    var outward = req.body.outward
    var letterFormat = req.body.letterFormat
    var type = req.body.type
    var user_id = req.body.user_id
    var verified_frompending;
    var deleteInstructional;
    var updateoutward
    try{
        if(source == 'guverification'){
            var updateoutward = await functions.saveOutwardNumber(app_id,user_id,outward,type,source,'',letterFormat,'',req.user.email,clientIP);
            if(updateoutward){
                var checkType=await functions.checkType(app_id,user_id,type)
                if(checkType == true){
                    var verify =  await functions.checkVerified(app_id,user_id,type,source);
                    if(verify == true){
                        request.post(VERIFY_BASE_URL + '/application/setVerified', { json: { "app_id": app_id, "userId": user_id, "value": 'pending', "email_admin": req.user.email, "outward": outward,"clientIP": clientIP} },
                        function (error, response, VERIFY) {
                            if (error) {
                            } else {
                                if (VERIFY.status == 200) {
                                    verified_frompending = true;
                                    var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                                    var activity = "Application Process";
                                    functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                                    res.json({
                                        status:200,
                                        verified_frompending:verified_frompending
                                    })
                    
                                } else {
                                    verified_frompending = false
                                    res.json({
                                        status:400,
                                        verified_frompending:verified_frompending,
                                        message : VERIFY.message
                                    })
                                }
                            }
                        })
                    }else{
                        verified_frompending=false;
                        await res.json({
                            status:200,
                            verified_frompending:verified_frompending
                        })
                    }
                }else{
                    verified_frompending = false
                    res.json({
                        status:400,
                        verified_frompending:verified_frompending,
                        message : 'outward is not updated'
                    })
                }
            }else{
                res.json({
                    status:400,
                    message : 'Outward Number Not Updated'
                })
            }
        }else if(source == 'gusyverification'){
            var updateoutward = await functions.saveOutwardNumber(app_id,user_id,outward,type,source,'',letterFormat,'',req.user.email,clientIP);
            if(updateoutward){
                var checkType=await functions.checkType(app_id,user_id,type)
                if(checkType == true){
                    var verify =  await functions.checkVerified(app_id,user_id,type,source);
                    if(verify == true){
                        request.post(SY_VERIFY_BASE_URL + '/application/setVerified', { json: { "app_id": app_id, "userId": user_id, "value": 'pending', "email_admin": req.user.email, "outward": outward,"clientIP": clientIP} },
                        function (error, response, VERIFY) {
                            if (error) {
                            } else {
                                if (VERIFY.status == 200) {
                                    verified_frompending = true;
                                    var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                                    var activity = "Application Process";
                                    functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                                    res.json({
                                        status:200,
                                        verified_frompending:verified_frompending
                                    })
                    
                                } else {
                                    verified_frompending = false
                                    res.json({
                                        status:400,
                                        verified_frompending:verified_frompending,
                                        message : VERIFY.message
                                    })
                                }
                            }
                        })
                    }else{
                        verified_frompending=true;
                        await res.json({
                            status:200,
                            verified_frompending:verified_frompending
                        })
                    }
                }else{
                    verified_frompending = false
                    res.json({
                        status:400,
                        verified_frompending:verified_frompending,
                        message : 'outward is not updated'
                    })
                }
            }else{
                res.json({
                    status:400,
                    message : 'Outward Number Not Updated'
                })
            }
        }else{

           var getOutwardAll = await functions.getAllOutward(app_id,type);
           updateoutward = await functions.saveOutwardNumber(app_id, user_id, outward, type, source, '','',getOutwardAll.length,req.user.email,clientIP);
          

            if(updateoutward){
            
                var verify =  await functions.checkVerified(app_id,user_id,type,source);

                if(verify){
                    if(source == 'guattestation'){
                        request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/pending/verifiedBy',{json:{"clientIP":clientIP,"id":app_id,"email_admin":req.user.email,"outward":''}},
                        function(error, response, VERIFY){
                            if(error){
                            }else{
                                if(VERIFY.status == 200){
                                    verified_frompending=true
                                    var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                                    var activity = "Application Process";
                                    functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                                        res.json({
                                            status : 200,
                                            message : 'Outward Number Updated',
                                            verified_frompending:verified_frompending
                                        })
                                }
                            }
                        })
                    }else if(source == 'gumoi'){
                        request.post(MOI_BASE_URL+'/admin/adminDashboard/pending/verifiedBy',{json:{"clientIP":clientIP,"id":app_id,"email_admin":req.user.email,"outward":''}},
                        function(error, response, VERIFY){
                            if(error){
                            }else{
                                if(VERIFY.status == 200){
                                    verified_frompending=true
                                    var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                                    var activity = "Application Process";
                                    functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                                        res.json({
                                            status : 200,
                                            message : 'Outward Number Updated',
                                            verified_frompending:verified_frompending
                                        })
                                }
                            }
                        })

                    }
                }else{
                    res.json({
                        status:400,
                        message  :'Outward Number Updated But Application Not Verified ',
                        verified_frompending:verified_frompending
                    })
            }  
            }else{
                res.json({
                    status:400,
                    message : 'Outward Number Not Updated'
                })
            }

        }
        

    }catch(e){
        res.status(500).json({
            status: 500,
            message: e.message,
        })
    }
})

router.get('/getOutwardData',getUserRole,async (req,res)=>{
    outwardvalue = [];
    var source;
    var bachoutward;
    var mastoutward;
    var Phdoutward;
    var marksheetoutward;
    var transcriptoutward;
    var symarksheet;
    var degreeoutward;
    var thesisoutward;
    var admin_email = req.user.email
    if(admin_email.includes('@edulab.in') && edulabAllow == false){
        res.json({
            status : 400,
            message : "You don't have permission"
        })
    }else{
        if (req.query.source == 'guattestation') {
            var applied = await functions.getAttestedforOutward(req.query.app_id)
            if (applied) {
                if (applied.instructionalField == true || applied.instructionalField == 1) {
                    var instructional = await functions.getInstructional(req.query.app_id);
                    //only bachelors
                    if (applied.applying_for == 'Bachelors') {
                        outwardvalue.push({
                            bachelorinstructional: true
                        })
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Bachelors');
                        bachoutward = getOutward.outward
                    }
                    //only masters
                    if (applied.applying_for == 'Masters') {
                        outwardvalue.push({
                            masterinstructional: true
                        })

                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Masters');
                        mastoutward = getOutward.outward
                    }
                    // master + bach
                    if (applied.applying_for == 'Masters,Bachelors') {
                        outwardvalue.push({
                            bachelorinstructional: true,
                            masterinstructional: true
                        })
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Bachelors');
                        bachoutward = getOutward.outward
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Masters');
                        mastoutward = getOutward.outward
                    }
                    // only phd
                    if (applied.applying_for == 'Phd,Masters,Bachelors') {
                        outwardvalue.push({
                            phdinstructional: true
                        })

                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Phd');
                        Phdoutward = getOutward.outward
                    }
                    // mast + bach + phd
                    if (applied.applying_for == 'Phd') {
                        outwardvalue.push({
                            bachelorinstructional: true,
                            masterinstructional: true,
                            phdinstructional: true
                        })
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Bachelors');
                        bachoutward = getOutward.outward
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Masters');
                        mastoutward = getOutward.outward
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Phd');
                        Phdoutward = getOutward.outward
                    }
                } else {
                    if (applied.attestedfor.includes('marksheet')) {
                        outwardvalue.push({
                            marksheet: true
                        })
                        var getOutward = await functions.getOutward_attestation(req.query.app_id, 'marksheets');
                        if (getOutward) {
                            marksheetoutward = getOutward.outward
                        }
                    }
                    if (applied.attestedfor.includes('transcript')) {
                        outwardvalue.push({
                            "transcript": true
                        })
                        var getOutward = await functions.getOutward_attestation(req.query.app_id, 'transcript');
                        if (getOutward) {
                            transcriptoutward = getOutward.outward
                        }
                    }
                    if (applied.attestedfor.includes('degree')) {
                        let provisional = await functions.getTranscriptProvisional(req.query.app_id);
                        if (provisional) {
                            outwardvalue.push({
                                "degree": true
                            })
                            var getOutward = await functions.getOutward_attestation(req.query.app_id, 'degree');
                            if (getOutward) {
                                degreeoutward = getOutward.outward
                            }
                        } else { }
                    }
                    if (applied.attestedfor.includes('thesis')) {
                        outwardvalue.push({
                            thesis: true
                        })
                        var getOutward = await functions.getOutward_attestation(req.query.app_id, 'thesis');
                        if (getOutward) {
                            thesisoutward = getOutward.outward
                        }
                    }
                }

            } else {
                res.json({
                    status: 400,
                    message: 'No Data of Attestation'
                })
            }
            source = 'guattestation'
        }
        if (req.query.source == 'gumoi') {
            var applied = await functions.getAttestedforOutward(req.query.app_id);
            if (applied) {
                if (applied.instructionalField == true || applied.instructionalField == 1) {
                    var instructional = await functions.getInstructional(req.query.app_id);
                    //only bachelors
                    if (applied.applying_for == 'Bachelors') {
                        outwardvalue.push({
                            bachelorinstructional: true
                        })
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Bachelors');
                        if (getOutward) {
                            bachoutward = getOutward.outward
                        }
                    }
                    //only masters
                    if (applied.applying_for == 'Masters') {
                        outwardvalue.push({
                            masterinstructional: true
                        })
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Masters');
                        if (getOutward) {
                            mastoutward = getOutward.outward
                        }
                    }
                    // master + bach
                    if (applied.applying_for == 'Masters,Bachelors') {
                        outwardvalue.push({
                            bachelorinstructional: true,
                            masterinstructional: true
                        })
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Bachelors');
                        if (getOutward) {
                            bachoutward = getOutward.outward
                        }
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Masters');
                        if (getOutward) {
                            mastoutward = getOutward.outward
                        }
                    }
                    // only phd
                    if (applied.applying_for == 'Phd,Masters,Bachelors') {
                        outwardvalue.push({
                            phdinstructional: true
                        })
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Phd');
                        if (getOutward) {
                            Phdoutward = getOutward.outward
                        }
                    }
                    // mast + bach + phd
                    if (applied.applying_for == 'Phd') {
                        outwardvalue.push({
                            bachelorinstructional: true,
                            masterinstructional: true,
                            phdinstructional: true
                        })
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Bachelors');
                        if (getOutward) {
                            bachoutward = getOutward.outward
                        }
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Masters');
                        if (getOutward) {
                            mastoutward = getOutward.outward
                        }
                        var getOutward = await functions.getOutward(req.query.app_id, 'instructional', 'Phd');
                        if (getOutward) {
                            Phdoutward = getOutward.outward
                        }
                    }
                } else {
                    if (applied.attestedfor.includes('marksheet')) {
                        outwardvalue.push({
                            marksheet: true
                        })
                    }
                    if (applied.attestedfor.includes('transcript')) {
                        outwardvalue.push({
                            "transcript": true
                        })
                    }
                    if (applied.attestedfor.includes('degree')) {
                        outwardvalue.push({
                            "degree": true
                        })
                    }
                    if (applied.attestedfor.includes('thesis')) {
                        outwardvalue.push({
                            thesis: true
                        })
                    }
                }

            } else {
                res.json({
                    status: 400,
                    message: 'No Data of Attestation'
                })
            }
            source = 'gumoi'
        }
        if (req.query.source == 'guverification') {
            let marksheetvalue = false;
            let transcriptvalue = false;
            let degreevalue = false;
            var appliedData = await functions.getDocumentDetailsData(req.query.app_id);
            appliedData.forEach((applied) => {
                if (applied) {
                    if (applied.type.includes('marksheet')) {
                        marksheetvalue = true


                    }
                    if (applied.type.includes('transcript')) {
                        transcriptvalue = true

                    }
                    if (applied.type.includes('degree')) {
                        if (applied.degree_Type == 'Degree Certificate') {
                            degreevalue = true
                        }
                    }
                    if (applied.type.includes('thesis')) {
                        outwardvalue.push({
                            thesis: true
                        })
                    }
                } else {
                    res.json({
                        status: 400,
                        message: 'No Data of Verification'
                    })
                }

            })
            if (marksheetvalue == true) {
                outwardvalue.push({
                    marksheet: true
                })
                var getOutward = await functions.getOutward_verification(req.query.app_id, 'marksheet');
                marksheetoutward = getOutward.outward
            }
            if (transcriptvalue == true) {
                outwardvalue.push({
                    transcript: true
                })
                var getOutward = await functions.getOutward_verification(req.query.app_id, 'transcript');
                transcriptoutward = getOutward.outward

            }
            if (degreevalue == true) {
                outwardvalue.push({
                    degree: true
                })
                var getOutward = await functions.getOutward_verification(req.query.app_id, 'degree');
                degreeoutward = getOutward.outward

            }

            source = 'guverification'
        }
        if (req.query.source == 'gusyverification') {
            var applied = await functions.getDocumentDetailsData(req.query.app_id);
            if (applied) {
                if (applied[0].type.includes('secondYear')) {
                    outwardvalue.push({
                        symarksheet: true
                    })
                    var getOutward = await functions.getsyOutwardNumber(req.query.app_id);
                    symarksheet = getOutward.outward
                }
            } else {
                res.json({
                    status: 400,
                    message: 'No Data of SyVerification'
                })
            }
            source = 'gusyverification'

        } 
    res.json({
        data  : outwardvalue,
        bachoutward : bachoutward,
        mastoutward:mastoutward,
        Phdoutward:Phdoutward,
        marksheetoutward: marksheetoutward,
        transcriptoutward: transcriptoutward,
        degreeoutward: degreeoutward,
        thesisoutward : thesisoutward,
        symarksheet:symarksheet,
        source : source,
        status: 200
    })
}
})

router.post('/saveOutwardMultiple', async (req, res) => {
    console.log("Dddddddddd",req.body);
    var app_id = req.body.app_id
    var source = req.body.serviceValue
    var user_id = req.body.user_id
    var university = req.body.university
    var serviceValue = req.body.serviceValue
    var syoutward = req.body.syoutward
    var marksheetoutward = req.body.marksheetoutward
    var transcriptoutward = req.body.transcriptoutward
    var degreeoutward = req.body.degreeoutward
    var thesisoutward = req.body.thesisoutward
    var bachinstructionaloutward = req.body.bachinstructionaloutward
    var mastinstructionaloutward = req.body.mastinstructionaloutward
    var phdinstructionaloutward = req.body.phdinstructionaloutward
    var service = req.body.service;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var getOutwardAll,updateoutward,setverified,deleteInstructional;

    if(university == 'mumbai'){
        
        updateoutward = await functions.saveOutwardNumber(app_id,user_id,value_mast,'instructional', source ,degree_mast,'','',req.user.email,clientIP);
        // var updateTracker = await functions.updateTracker(app_id);
        // if(updateTracker){
        //     console.log("Ddddd",updateTracker);
        //     var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
        //     var activity = "Application Process";
        //     await functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
        //         res.json({
        //             status : 200,
        //             message : 'Application Procssed'
        //         })
        // }else{
        //     res.json({
        //         status : 400,
        //         message : VERIFY.message
        //     })
        // }

    }

    if(university == 'sou'){
        updateoutward = await functions.saveOutwardNumber(app_id,user_id,value_mast,'instructional',source,degree_mast,'','',req.user.email,clientIP);
        var updateTracker = await functions.updateTracker(app_id);
        if(updateTracker){
            console.log("Ddddd",updateTracker);
            var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
            var activity = "Application Process";
            await functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                res.json({
                    status : 200,
                    message : 'Application Procssed'
                })
        }else{
            res.json({
                status : 400,
                message : VERIFY.message
            })
        }
    }

    if(university == 'gu'){
        if(source == 'guverification'){
            if(marksheetoutward != ''){
                getOutwardAll = await functions.getOutward_verification(app_id, 'marksheet');
                if(getOutwardAll){
                    updateoutward = await functions.updateverifyoutward(app_id, user_id, marksheetoutward, 'marksheet');
                }else{
                    updateoutward = await functions.saveOutwardNumber(app_id,user_id,marksheetoutward,'marksheet',source,'',null,'',req.user.email,clientIP)
                }
                setverified  = await functions.updateVerify(app_id,user_id,'marksheet',source);
            }
            if(transcriptoutward != ''){
                getOutwardAll = await functions.getOutward_verification(app_id, 'transcript');
                if(getOutwardAll){
                    updateoutward = await functions.updateverifyoutward(app_id, user_id, transcriptoutward, 'transcript');
                }else{
                    updateoutward = await functions.saveOutwardNumber(app_id,user_id,transcriptoutward,'transcript',source,'',null,'',req.user.email,clientIP)
                }
                setverified  = await functions.updateVerify(app_id,user_id,'transcript',source);
            }
            if(degreeoutward != ''){
                getOutwardAll = await functions.getOutward_verification(app_id, 'degree');
                if(getOutwardAll){
                    updateoutward = await functions.updateverifyoutward(app_id, user_id, degreeoutward, 'degree');
                }else{
                    updateoutward = await functions.saveOutwardNumber(app_id,user_id,degreeoutward,'degree',source,'',null,'',req.user.email,clientIP)
                }
                setverified  = await functions.updateVerify(app_id,user_id,'degree',source);
            }
    
            await request.post(VERIFY_BASE_URL+'/application/setVerified',{json:{"clientIP":clientIP,"app_id":app_id,"userId":user_id,"value":'pending',"email_admin":req.user.email,"outward":''}},
            async function(error, response, VERIFY){
                if(error){
                }else{
                    if(VERIFY.status == 200){
                        var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                        var activity = "Application Process";
                        await functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                            res.json({
                                status : 200,
                                message : 'Outward Number Updated'
                            })
                    }else{
                        res.json({
                            status : 400,
                            message : VERIFY.message
                        })
                    }
                }
            })
    
        }
        else if(source == 'gusyverification'){
            if(syoutward != ''){
                getOutwardAll = await functions.getsyOutwardNumber(app_id,user_id);
                if(getOutwardAll){
                    updateoutward = await functions.updatesyoutward(app_id, user_id, syoutward);
                }else{
                    updateoutward = await functions.saveOutwardNumber(app_id,user_id,syoutward,'',source,'',null,'',req.user.email,clientIP)
                }
                setverified  = await functions.updateVerify(app_id,user_id,'',source);
            }
    
            await request.post(SY_VERIFY_BASE_URL+'/application/setVerified',{json:{"clientIP":clientIP,"app_id":app_id,"userId":user_id,"value":'pending',"email_admin":req.user.email,"outward":''}},
            async function(error, response, VERIFY){
                if(error){
                }else{
                    if(VERIFY.status == 200){
                        var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                        var activity = "Application Process";
                        await functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                            res.json({
                                status : 200,
                                message : 'Outward Number Updated'
                            })
                    }else{
                        res.json({
                            status : 400,
                            message : VERIFY.message
                        })
                    }
                }
            })
        }
        else if(source == 'guattestation'){
            if(marksheetoutward != ''){
                getOutwardAll = await functions.getAllOutward(app_id,'marksheets');   
                updateoutward = await functions.saveOutwardNumber(app_id,user_id,marksheetoutward,'marksheets',source,'','',getOutwardAll.length,req.user.email,clientIP);
                setverified = await functions.updateVerify(app_id, user_id, 'marksheets', source);
            }
            if(transcriptoutward != ''){
                getOutwardAll = await functions.getAllOutward(app_id,'transcript');  
                updateoutward = await functions.saveOutwardNumber(app_id,user_id,transcriptoutward,'transcript',source,'','',getOutwardAll.length,req.user.email,clientIP);
                setverified = await functions.updateVerify(app_id, user_id, 'transcript', source);
            }
            if(degreeoutward != ''){
                getOutwardAll = await functions.getAllOutward(app_id,'degree');   
                updateoutward = await functions.saveOutwardNumber(app_id,user_id,degreeoutward,'degree',source,'','',getOutwardAll.length,req.user.email,clientIP);
                setverified = await functions.updateVerify(app_id, user_id, 'degree', source);
            }
            if(thesisoutward != ''){
                getOutwardAll = await functions.getAllOutward(app_id,'thesis');   
                updateoutward = await functions.saveOutwardNumber(app_id,user_id,thesisoutward,'thesis',source,'','',getOutwardAll.length,req.user.email,clientIP);
                setverified = await functions.updateVerify(app_id, user_id, 'thesis', source);
            }
    
            await request.post(ATTESTATION_BASE_URL+'/admin/adminDashboard/pending/verifiedBy',{json:{"clientIP":clientIP,"id":app_id,"email_admin":req.user.email,"outward":''}},
            async function(error, response, VERIFY){
                if(error){
                }else{
                    if(VERIFY.status == 200){
                        var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                        var activity = "Application Process";
                        await functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                            res.json({
                                status : 200,
                                message : 'Outward Number Updated'
                            })
                    }else{ 
                        res.json({
                            status : 400,
                            message:VERIFY.message
                        })
                    }
                }
            })
    
        }
        else if(source == 'gumoi'){
            var degree;
            var value;
            if(bachinstructionaloutward != '' && mastinstructionaloutward == ''){
                getOutwardAll = await functions.getAllOutward_instructional(app_id,'instructional','Bachelors');
                degree = 'Bachelors';
                value  = bachinstructionaloutward
                if(getOutwardAll.length  > 0){
                    deleteInstructional = await functions.destroyoutward_instructional(app_id,'instructional',degree);
                }
            }else if(mastinstructionaloutward != '' && bachinstructionaloutward == '' ){
                getOutwardAll = await functions.getAllOutward_instructional(app_id,'instructional','Masters');
                degree = 'Masters';
                value  = mastinstructionaloutward;
                if(getOutwardAll.length  > 0){
                    deleteInstructional = await functions.destroyoutward_instructional(app_id,'instructional',degree);
                }
            }else{
                getOutwardAll_Masters = await functions.getAllOutward_instructional(app_id,'instructional','Masters');
                getOutwardAll_Bachelors = await functions.getAllOutward_instructional(app_id,'instructional','Bachelors');
                if(getOutwardAll_Bachelors.length  > 0){
                    deleteInstructional = await functions.destroyoutward_instructional(app_id,'instructional','Bachelors');
                }
                  if(getOutwardAll_Masters.length  > 0){
                    deleteInstructional = await functions.destroyoutward_instructional(app_id,'instructional','Masters');
                }
              var  degree_mast = 'Masters';
              var  value_mast  = mastinstructionaloutward;
              var degree_bach = 'Bachelors';
              var  value_bach  = bachinstructionaloutward;
                updateoutward = await functions.saveOutwardNumber(app_id,user_id,value_mast,'instructional',source,degree_mast,'','',req.user.email,clientIP);
                updateoutward = await functions.saveOutwardNumber(app_id,user_id,value_bach,'instructional',source,degree_bach,'','',req.user.email,clientIP);
            }
            updateoutward = await functions.saveOutwardNumber(app_id,user_id,value,'instructional',source,degree,'','',req.user.email,clientIP);
            setverified  = await functions.updateVerify(app_id,user_id,'instructional',source);
    
            await request.post(MOI_BASE_URL+'/admin/adminDashboard/pending/verifiedBy',{json:{"clientIP":clientIP,"id":app_id,"email_admin":req.user.email,"outward":'',"clientIP":clientIP}},
            async function(error, response, VERIFY){
                if(error){
                }else{
                    if(VERIFY.status == 200){
                        var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                        var activity = "Application Process";
                        await functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                            res.json({
                                status : 200,
                                message : 'Outward Number Updated'
                            })
                    }else{
                        res.json({
                            status : 400,
                            message:VERIFY.message
                        })
                    }
                }
            })
        }
        else if(service.includes('pdc') || service.includes('guconvocation') || service.includes('gumigration') || service.includes('guinternship') ){
            updateoutward = await functions.saveOutwardNumber(app_id,user_id,value_mast,'instructional',source,degree_mast,'','',req.user.email,clientIP);
            var updateTracker = await functions.updateTracker(app_id);
            if(updateTracker){
                console.log("Ddddd",updateTracker);
                var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
                var activity = "Application Process";
                await functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                    res.json({
                        status : 200,
                        message : 'Application Procssed'
                    })
            }else{
                res.json({
                    status : 400,
                    message : VERIFY.message
                })
            }
        }
    }

    if(university == 'hsnc'){
        updateoutward = await functions.saveOutwardNumber(app_id,user_id,value_mast,'instructional',source,degree_mast,'','',req.user.email,clientIP);
        var updateTracker = await functions.updateTracker(app_id);
        if(updateTracker){
            console.log("Ddddd",updateTracker);
            var desc = "App Id  " + app_id + " processed from pending to verified " + " by "+  req.user.email;
            var activity = "Application Process";
            await functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
                res.json({
                    status : 200,
                    message : 'Application Procssed'
                })
        }else{
            res.json({
                status : 400,
                message : VERIFY.message
            })
        }
    }

})

router.post('/verifyparticularDocuments', async (req, res) => {
    var app_id = req.body.app_id
    var user_id = req.body.user_id
    var checked = req.body.checked;
    var type = req.body.type
    var source = req.body.source
    var doc_id = req.body.doc_id
    var outward = req.body.outward
    var noofmarksheet;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	var showDialog = false;
    var verify;
    var verified_frompending;

    if(source == 'guattestation' || source == 'gumoi'){
        await functions.updateDocuments(doc_id,type,source,checked);
        if(checked == true){
            let show =  await functions.allMarksheet(user_id,app_id,type,source);
            if(show){
                showDialog = false
            }else{
                showDialog = true
            }
            res.json({
                status : 200,
                showDialog : showDialog,
                verified_frompending : false
            });
        }else{
        }
    }else{
        await functions.updateDocuments(doc_id,type,source,checked);
        if(checked == true){
            let show =  await functions.allMarksheet(user_id,app_id,type,source);
            require('async').eachSeries(show, function(student, callback){
                    if(student.verify_doc == 1){
                        showDialog = true
                    }else{
                        showDialog = false
                    }
                callback();
            },  async function(){
                res.json({
                    status : 200,
                    showDialog : showDialog,
                    verified_frompending : false
                });
              
            });
        }else{

        }
    }
       
})

router.post('/setDocumentAs',async(req,res)=>{
       var id =  req.body.doc_id;
       var setas =  req.body.setas;
       var setDocumentas = await functions.setDocumentas(id,setas);
       if(setDocumentas){
                res.json({
                    status : 200
                })
       }else{
        res.json({
            status : 400
        })
       }

})

router.get('/getAdminDetails',getUserRole,(req,res)=>{
    var data = {
        marksheet : req.marksheet,
        transcript : req.transcript,
        degree : req.degree,
        thesis : req.thesis,
        moi : req.moi
    }
    res.json({
        status : 200,
        data : data
    })
})

router.post('/saveInstructional', async (req, res) => {
    var id = req.body.id
    var value = req.body.value
    var diff_college_one =[];
	var diff_college_two=[];
    var selected_pattern=[];
    diff_college_one.push({
		collegeName:value.college,
		yearofpassing:value.yearpassing,
		yearofenrollment:value.yearenrollment,
		clg : value.affiliated,
	  })
	  if(value.end_year==''){
		selected_pattern = null;
	  }else{
		selected_pattern.push({
			pattern:value.pattern,
			end_year:value.end_year,
			Start_year:value.Start_year
        			  })
	  }
      if(value.college_two==''){
		diff_college_two = null;
	  }else{
		diff_college_two.push({
			collegeName:value.college_two,
			yearofpassing:value.yearpassing_two,
			yearofenrollment:value.yearenrollment_two,
			clg : value.affiliated_two,	
			  })
	  }

      models.InstructionalDetails.findAll({
        where :{
            id : id
        }
      }).then(async function(data){
        if(data[0].education.includes('null')){
            models.userMarkList.findAll({
                where : {
                    user_id : data[0].userId,
                    faculty :data[0].courseName
                }
            }).then(function(userData){
                if(value.education.includes('null')){
                    res.json({
                        status:400
                    })
                }else{
                     userData[0].update({
                        course_faculty : value.education
                    }).then(function(details){
                        data[0].update({
                            education :userData[0].type+'_'+userData[0].course_faculty,
                            new_course_faculty:userData[0].course_faculty
                        }).then(function(updatedata){

            var desc = req.user.email+" has been updated insructional details."
            var activity = "insructional details updated ";
            functions.activitylog(req,data[0].userId, activity, desc, data[0].app_id,'guAdmin');
                            res.json({
                                status:200
                            })
                        })
                    })
                }
            })
        }else{
            var updateinstruct = await functions.saveInstructional(id,value,diff_college_one,diff_college_two,selected_pattern);
            if(updateinstruct){
                var desc = req.user.email+" has been updated insructional details."
                var activity = "insructional details updated ";
                functions.activitylog(req,data[0].userId, activity, desc, data[0].app_id,'guAdmin');
              res.json({
                  status:200
              })
          }else{
              res.json({
                  status:400
              })
          }
        }
      })
})

router.get('/getParticularInstructionalDetails',(req,res)=>{
    var id = req.query.id;
    models.InstructionalDetails.findOne({
        where : {
            id  : id
        }
    }).then(function (inst){
        if(inst){
            res.json({
                status : 200,
                data : inst
            })
        }else{
            res.json({
                status : 400
            })
        }
        
    })
 
})

router.delete('/deleteDocument',  (req,res)=>{
    var id = req.query.id;
    var app_id =  req.query.app_id;
    var user_id =  req.query.userId;

        let deletedvalue =  functions.deleteDocument(id,'instructional','gumoi',user_id,app_id);
        if(deletedvalue){
            var desc = "app_id "+ app_id +" instructional deleted " + " by "+  req.user.email;
            var activity = "Document Deleted";
            functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
            res.json({
                status : 200
            })
        }else{
            res.json({
                status : 400
            })
        }
    })

router.get('/collegeManagement/getCollegeData',function(req,res) {
    models.College.getAllColleges().then(colleges=>{
        res.json({
            status : 200,
            items : colleges
        })
    })
})

router.get('/getCousreData',function(req,res) {
    models.Program_List.getalldata().then(courseData=>{
        res.json({
            status : 200,
            items : courseData
        })
    })
})

router.post('/collegeManagement/updateCollegeStatus',function(req,res) {
    var college_id = req.body.college_id;
    var college_name = req.body.college_name;
    var college_status = req.body.college_status;
    var count = 0;
    models.Program_List.activeInactiveCollege(college_name, college_status).then(function(college_updated){
        if(college_updated){
            res.json({
                status : 200,
            })
        }else{
            res.json({
                status : 400,
            })
        }
    })
})

/**
 * This route will help to delete college
 */

router.post('/collegeManagement/removeCollege',function(req,res) {
    var college = req.body.college;
    models.College.destroy({
        where : {
            id : college.id
        }
    }).then(function(collegee){
        if(collegee ){
            var desc = req.user.email+ ' deleted college ' +college.name;
            var activity = "College deleted";
            functions.activitylog(req,null, activity, desc, null, 'guAdmin');
        }
        res.json({
            status : 200,
            msg: "college deleted"
        })
    })
})

/**
 * This route will help to delete course
 */

router.post('/collegeManagement/removeCourse',function(req,res) {
    var course = req.body.course;
    models.Program_List.destroy({
        where : {
            id : course.id
        }
    }).then(function(coursee){
        if(coursee ){
            var desc = req.user.email+ ' deleted course ' +course.course_name;
            var activity = "Course deleted";
            functions.activitylog(req,null, activity, desc, null, 'guAdmin');
        }
        res.json({
            status : 200,
            msg:"course deleted"
        })
    })
})

router.post('/collegeManagement/addcourse',function(req,res) {
    var addEdit = req.body.addEdit
    if(addEdit=='add'){ 
      models.Program_List.create({
         course_name: req.body.course_name,
         degree_type: req.body.degree_type.degree_t,
         duration : req.body.duration,
         faculty: req.body.faculty,
         new_course_faculty: req.body.faculty,
         college_short_form : req.body.college_short_form,
 
      }).then(function(createdCourse){
          if(createdCourse){
              res.json({
                  status : 200
              })
          }else{
              res.json({
                  status : 400
              })
          }
      });
     }else{
         models.Program_List.updatecourse(req.body.course_name,req.body.degree_type.degree_t,req.body.duration,req.body.id,req.body.faculty,req.body.college_short_form).then(function(college_updated){
             if(college_updated){
                 res.json({
                     status : 200
                 })
             }else{
                 res.json({
                     status : 400
                 })
             }
         })
     }
 
 })

router.post('/sendEmailToCollege',function(req,res){
    var user_id = req.body.user_id;
    var college_id = req.body.collegeId;
    
   
    models.User.find({
        where : {
            id : user_id
        }
    }).then(function(user){
        models.College.find({
            where :{
                id  : college_id
            }
        }).then(function(college){
            if(user.educationalDetails == true){
                models.User_Transcript.findAll({
                    where : {
                        user_id : user_id,
                        collegeId : college.id
                    }
                }).then(function(userTranscripts){
                    var singleCollege = {
                        type: '',
                        user_id : '',
                        collegeName : '',
                        studentName : '',
                        courseName : '',
                        college_id : '',
                        collegeEmail : '',
                        alternateEmail : '',
                        user_transcript : [],
                        user_markList : [],
                        user_curriculum : [],
                    }
                    singleCollege.type = 'educationalDetails';
                    singleCollege.user_id =  user_id;
                    singleCollege.collegeName = college.name;
                    singleCollege.studentName = user.name + ' ' + user.surname;
                    singleCollege.college_id = college_id;
                    singleCollege.collegeEmail = college.emailId;
                    singleCollege.alternateEmail = college.alternateEmailId;
                    userTranscripts.forEach(userTranscript=>{
                        singleCollege.user_transcript.push({'fileName':userTranscript.file_name,'transcript':'upload/transcript/'+ user_id + "/" + urlencode(userTranscript.file_name)});
                    });
                    models.userMarkList.find({
                        where:{
                            user_id : user_id,
                            collegeId : college_id
                        }
                    }).then(function(userMarkListsData){
                        models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                        userMarkLists.forEach(userMarkList=>{
                            if((userMarkList.file_name !='null' && userMarkList.file_name!=null)&& (userMarkList.usermarklist_file_name==null)){
                            singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.file_name)});
                            }else if((userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null) && (userMarkList.file_name ==null)){
                            singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.usermarklist_file_name)});
                            }else if(userMarkList.file_name !='null' && userMarkList.file_name!=null && userMarkList.usermarklist_file_name !='null' && userMarkList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':userMarkList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.file_name)});
                                singleCollege.user_markList.push({'fileName':userMarkList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(userMarkList.usermarklist_file_name)});

                            }
                        });

                        setTimeout(function(){
                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                json: {
                                    singleCollege : singleCollege
                                }
                            }, function (error, response, body) {
                                if(body.notSent.length > 0){
                                    body.noteSent.forEach(data=>{
                                        models.User_Transcript.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');
                                    })
                                }
                                body.data.forEach(msgId=>{
                                    models.User_Transcript.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');
                                });
                                  
                            })
                        },1000);
                    });
                    })
                })
            }
            if(user.instructionalField == true){
                var singleCollege = {
                    type: '',
                    user_id : '',
                    collegeName : '',
                    studentName : '',
                    courseName : '',
                    college_id : '',
                    collegeEmail : '',
                    alternateEmail : '',
                    user_transcript : [],
                    user_markList : [],
                    user_curriculum : [],
                }
                models.InstructionalDetails.findOne({
                    where :{
                        userId : user_id
                    }
                }).then(function(instructional){
                    models.userMarkList.find({
                        where :{
                            user_id : user_id,
                            collegeId : college_id
                        }
                    }).then(function(userMarkListsData){
                        models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){     
                        singleCollege.type = 'instructionalField';
                        singleCollege.user_id = user_id;
                        singleCollege.collegeName = college.name;
                        singleCollege.studentName = instructional.studentName;
                        singleCollege.courseName = instructional.courseName;
                        singleCollege.college_id = college.id;
                        singleCollege.collegeEmail = college.emailId;
                        singleCollege.alternateEmail = college.alternateEmailId;
                        userMarkLists.forEach(markList=>{
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});

                            }
                        });

                        setTimeout(function(){
                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                json: {
                                    singleCollege : singleCollege
                                }
                            }, function (error, response, body) {
                                if(body.notSent.length > 0){
                                    body.noteSent.forEach(data=>{
                                        models.InstructionalDetails.updateSingleEmailStatus(user_id,null,'not sent');
                                    })
                                }
                                body.data.forEach(msgId=>{
                                    models.InstructionalDetails.updateSingleEmailStatus(user_id,msgId.msg_id,'sent');
                                });
                                  
                            })
                        },1000);
                    })
                })
                })
            }
            if(user.curriculum == true){
                models.User_Curriculum.findAll({
                    where : {
                        user_id : user_id,
                        collegeId : college_id
                    }
                }).then(function(userCurriculum){
                    var singleCollege = {
                        type: '',
                        user_id : '',
                        collegeName : '',
                        studentName : '',
                        courseName : '',
                        college_id : '',
                        collegeEmail : '',
                        alternateEmail : '',
                        user_transcript : [],
                        user_markList : [],
                        user_curriculum : [],
                    }
                    singleCollege.type = 'curriculum';
                    singleCollege.user_id = user_id;
                    singleCollege.collegeName = college.name;
                    singleCollege.collegeEmail = college.emailId;
                    singleCollege.studentName = user.name + ' ' + user.surname;
                    singleCollege.college_id = college.id;
                    singleCollege.alternateEmail = college.alternateEmailId; 
                    userCurriculum.forEach(curriculum=>{
                        singleCollege.user_curriculum.push({'fileName':curriculum.file_name,'curriculum':'upload/curriculum/'+ user_id + "/" + urlencode(curriculum.file_name)});
                    });
                    models.userMarkList.find({
                        where : {
                            user_id : user_id,
                            collegeId : college_id
                        }
                    }).then(function(userMarkListsData){
                        models.UserMarklist_Upload.getMarksheetDataSendToCollege(userMarkListsData.user_id,userMarkListsData.collegeId).then(function(userMarkLists){      
                        userMarkLists.forEach(markList=>{
                            if((markList.file_name !='null' && markList.file_name!=null)&& (markList.usermarklist_file_name==null)){
                            singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                            }else if((markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null) && (markList.file_name ==null)){
                            singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});
                            }else if(markList.file_name !='null' && markList.file_name!=null && markList.usermarklist_file_name !='null' && markList.usermarklist_file_name !=null){
                                singleCollege.user_markList.push({'fileName':markList.file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.file_name)});
                                singleCollege.user_markList.push({'fileName':markList.usermarklist_file_name,'markList':'upload/marklist/'+ user_id + "/" + urlencode(markList.usermarklist_file_name)});

                            }
                        });

                        setTimeout(function(){
                            request.post(constant.BASE_URL_SENDGRID + 'transcriptVerificationEmailResend', {
                                json: {
                                    singleCollege : singleCollege
                                }
                            }, function (error, response, body) {
                                if(body.notSent.length > 0){
                                    body.noteSent.forEach(data=>{
                                        models.User_Curriculum.updateSingleCollegeEmailStatus(user_id,data.college_id,null,'not sent');
                                    })
                                }
                                body.data.forEach(msgId=>{
                                    models.User_Curriculum.updateSingleCollegeEmailStatus(user_id,msgId.college_id,msgId.msg_id,'sent');
                                });
                                  
                            })
                        },1000);
                    })
                  });
                })
            }
            setTimeout(()=>{
                res.json({
                    status : 200
                }) 
            },4000);
        })
    })
})

router.post('/collegeManagement/addOrUpdateCollegeData',function(req,res) {
    var collegeData = req.body.data;
    let affiliated;
    if(collegeData.category == 'Affiliated'){
        affiliated = 'is'
    }else{
        affiliated = 'was'
    }
   if(collegeData.addEdit == 'add'){
     models.College.create({
         college_code: collegeData.college_Address,
         name: collegeData.name,
         affiliation:affiliated,
         type : 'college',
         status  : 'active',
         created_at : moment(new Date()),
         updated_at : moment(new Date())
     }).then(function(createdCollege){
         if(createdCollege){
             res.json({
                 status : 200
             })
         }else{
             res.json({
                 status : 400
             })
         }
     });
   }else{
    models.College.updateCollege(collegeData.name,collegeData.college_Address,affiliated,collegeData.id).then(function(college_updated){
         if(college_updated){
             res.json({
                 status : 200
             })
         }else{
             res.json({
                 status : 400
             })
         }
     })
   }
})

router.post('/collegeManagement/addOrUpdateCourseData',function(req,res) {
    var courseData = req.body.courseData; 
    if(courseData.addEdit == 'add'){
        models.Program_List.find({
            where : {
                college_name : courseData.college_name,
            }
        }).then(function(course){
            if(course){
                if(course.course_name == null || course.course_name == '' || course.course_name == undefined ){
                    course.update({
                      
                        emailId: courseData.emailId,
                        contactNo: courseData.contactNo,
                        contactPerson : courseData.contactPerson,
                        alternateContactPerson : courseData.alternateContactPerson,
                        alternateContactNo : courseData.alternateContactNo,
                        alternateEmailId : courseData.alternateEmailId,
                         course_name : courseData.CourseNameCerti,
                        updated_at : moment(new Date())
                    }).then(function(course_details_updated){
                        if(course_details_updated){
                            res.json({
                                status : 200
                            })
                        }else{
                            res.json({
                                status : 400
                            })
                        }
                    })
                }else{
                    models.Program_List.create({
                      
                        college_name: courseData.college_name,
                        college_address : course.college_address,
                        emailId: courseData.emailId,
                        contactNo: courseData.contactNo,
                        contactPerson : courseData.contactPerson,
                        alternateContactPerson : courseData.alternateContactPerson,
                        alternateContactNo : courseData.alternateContactNo,
                        alternateEmailId : courseData.alternateEmailId,
                        course_name : courseData.CourseNameCerti,
                        created_at : moment(new Date()),
                        updated_at : moment(new Date())
                    }).then(function(course_details_updated){
                        if(course_details_updated){
                            models.Program_List.updateAllCourse(course.college_name , course_details_updated.emailId, course_details_updated.contactNo, course_details_updated.contactPerson, course_details_updated.alternateEmailId, course_details_updated.alternateContactPerson, course_details_updated.alternateContactNo, replacestring ).then(function(course_code_updated){

                            })
                            res.json({
                                status : 200
                            })
                        }else{
                            res.json({
                                status : 400
                            })
                        }
                    })

                }
            }else{
                res.json({
                    status : 400
                })
            }
        })
    }else{
        models.Program_List.find({
            where : {
                id : courseData.id
            }
        }).then(function(course_details){
            if(course_details){
                course_details.update({
                   
                      emailId: courseData.emailId,
                    contactNo: courseData.contactNo,
                    contactPerson : courseData.contactPerson,
                    alternateContactPerson : courseData.alternateContactPerson,
                    alternateContactNo : courseData.alternateContactNo,
                    alternateEmailId : courseData.alternateEmailId,
                    course_name : courseData.CourseNameCerti,
                    updated_at : moment(new Date())
                }).then(function(course_details_updated){
                    if(course_details_updated){
                        models.Program_List.updateAllCourse(course_details.college_name , course_details_updated.emailId, course_details_updated.contactNo, course_details_updated.contactPerson, course_details_updated.alternateEmailId, course_details_updated.alternateContactPerson, course_details_updated.alternateContactNo, replacestring ).then(function(course_code_updated){

                        })
                        res.json({
                            status : 200
                        })
                    }else{
                        res.json({
                            status : 400
                        })
                    }
                })
            }else{
                res.json({
                    status : 400
                })
            }
       })
    }
})

router.post('/saveapplication',function(req,res) {
    var id = req.body.userid; 
    var appid = req.body.app_id; 
    var source = req.body.source; 
    var value = req.body.value;
    
    models.Application.update({
        tracker:'apply',
        status:value,
        print_signedstatus:'print_signed'
    },{
        where:{
            id:req.body.app_id,
            source_from:req.body.source
        }
    }).then(async function(data){
        if(data ){
            var desc = "Tracker  for " + appid + " is updated to " + value  + " by "+  req.user.email;
            var activity = "Tracker Update";
            functions.activitylog(req,id, activity, desc, appid, 'guAdmin');
        }
        // if(req.body.source == 'guattestation'|| req.body.source == 'gumoi'){
        //     var delete_userenroll = await functions.delete_userenroll_att(id,appid);
        // }
        res.json({
            status: 200,
        })
    })
    
})

router.post('/adminResetPassword',  function (req, res) {
    var body_data = req.body.data;
    var password = '123456';
    if(req.body.type=='password'){
    if (password == '123456') {
        var hashPassword = functions.generateHashPassword(password);
        models.User.findOne({
            where: {
                email: body_data
            }
        }).then(function (User_data) {
            User_data.update({
                password: hashPassword.hashPassword
            });
            if(res.statusCode == 200){
            res.json({
                status: 200,
                data: User_data,
                message: 'Password Reset successfully'
            });
            var desc = "Password Reset successfully for " + body_data + " " + password  + " by "+  req.user.email;
                    var activity = "Password Reset";
                    functions.activitylog(req,req.body.userId, activity, desc, req.body.id, 'guAdmin');
        }else{
            res.json({
                status: 400,
                message: 'Unsuccessfull'
            });
        }
        })
    } else {
        res.json({
            status: 401,
            message: 'Something went wrong while changing your Password'
        });
    }
}else if(req.body.type=='otp'){
    models.User.findOne({
        where: {
            email: body_data
        }
    }).then(function(user) {
             if(user){
                user.update({
                    is_otp_verified: 1,
                    is_email_verified: 1,
                    otp: null,
                    email_verification_token: null
                })
                if(res.statusCode==200){
                res.json({
                    status: 200,
                    data: user
                })
                var desc = "OTP verify successfully for " + body_data + " " +" by "+  req.user.email;
                var activity = "OTP verify";
                functions.activitylog(req,req.body.userId, activity, desc, req.body.id, 'guAdmin');
           
            }else{
                 res.json({
                    status: 400,
                    message: 'Unsuccessfull'
                });
            }
            }
        })
}
});

router.post('/uploadUserMarkList',function(req,res){
	var userId = req.query.user_id;
	var image;
	var transcript_name = req.query.transcript_name;
	var education_type = req.query.education_type;
	var user_marklistid = req.query.user_marklistid;
	var app_id = (req.query.app_id) ? req.query.app_id : null;
	var fileStatus= false;
	var doc_id = req.query.doc_id;
	var source = req.query.source;
	var ext;
	var dir = FILE_LOCATION + "public/upload/documents/" + userId;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
  	var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, FILE_LOCATION+'public/upload/documents/'+userId);
		},
		filename: function(req, file, callback) {
			var extension = path.extname(file.originalname)
			var randomString = functions.generateRandomString(10,'alphabetic')
			var newFileName = randomString.concat(extension);
			image = newFileName;
			callback(null, newFileName);
		}
	});

	var upload = multer({
		storage: storage,
		fileFilter: function (req, file, callback) {
			ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.JPEG' && ext !== '.PDF') {
				return callback(res.end('Please upload your document in .pdf, .jpeg, .jpg or .png formats only'), null)
			}
			callback(null, true)
		}
	}).single('file');
	upload(req, res, function (err, data) {
		imageLocationToCallClient = image;
		if (ext == '.pdf') {
			fs.readFile(FILE_LOCATION +'public/upload/documents/' + userId + '/' + image, (err, pdfBuffer) => {
			//	fs.readFile(constant.FILE_LOCATION +'public\\upload\\marklist\\' + userId + '\\' + image, (err, pdfBuffer) => {
					new pdfreader.PdfReader().parseBuffer(pdfBuffer, function (err, item) {
					if (err) {
						uploadValue = false;
						ValueUpdateData(uploadValue);
					} else if (!item) {
						uploadValue = true;
						ValueUpdateData(uploadValue);
					} else if (item.text) {}
				});
			});
		} else {
			uploadValue = true;
			ValueUpdateData(uploadValue);
		}

		function ValueUpdateData(uploadValue) {
			if (uploadValue == true) {
				models.UserMarklist_Upload.findAll({
					where :{
						user_id: userId,
					}
				}).then((datam)=>{
                    if(datam.length > 0){
						datam.forEach(function(marklistData){
							if(marklistData){
								if(marklistData.file_name == imageLocationToCallClient){
									fileStatus=true;
								}
							}
						})
					}
                    if(fileStatus==true){
						res.json({
							status: 200,
							message: `File already exist. please upload another file!!!..`,
						})
					}else{
						if(doc_id != undefined && doc_id != null && doc_id != ''){
							models.UserMarklist_Upload.findOne({
								where :{
									id : doc_id
								}
							}).then(function(marksheetUpload){
                                marksheetUpload.update({
									file_name: imageLocationToCallClient,
									lock_transcript : false,
									upload_step : 'changed'
								}).then(function(updatedMarksheetUpload){
									if (updatedMarksheetUpload) {
										models.Application.update(
											{status  : 'changed'},
											{where:
												{id  : app_id}
											}).then((err,updated)=>{
												if(err){
													console.error(err);
												}
													
												
                                                var desc ="Marksheet named " +  updatedMarksheetUpload.name + " is being replaced "+"( "+ updatedMarksheetUpload.file_name+" )"+" by " + req.user.email
												var activity = "Marksheet Re-upload Document";
												functions.activitylog(req,userId, activity, desc, '',app_id,'guAdmin');
												return res.json({
													status: 200,
													message: `Upload Completed.`,
													data : updatedMarksheetUpload
												});
											})										
									} else {
										return res.json({
											status: 400,
											message: `Error occured in uploading document.`
										});
									}
								})
							})
						}else{
							if(app_id == null){
								models.UserMarklist_Upload.create({
									name: transcript_name,
									user_id: userId,
									user_marklist_id:req.query.user_marklistid,
									education_type: education_type,
									file_name: imageLocationToCallClient,
									lock_transcript : false,
									upload_step : "default",
                                    source :source
								}).then(function (userMarklist) {
									if (userMarklist) {
										return res.json({
											status: 200,
											message: `Upload Completed.`,
											data : userMarklist
										});
									} else {
										return res.json({
											status: 400,
											message: `Error occured in uploading document.`
										});
									}

								});
							}else{
								models.UserMarklist_Upload.create({
									name: transcript_name,
									user_id: userId,
									user_marklist_id:req.query.user_marklistid,
									education_type: education_type,
									file_name: imageLocationToCallClient,
									lock_transcript : false,
									upload_step : "changed",
									app_id : app_id,
                                    source: source
								}).then(function (userMarklist) {
									if (userMarklist) {
										return res.json({
											status: 200,
											message: `Upload Completed.`,
											data : userMarklist
										});
									} else {
										return res.json({
											status: 400,
											message: `Error occured in uploading document.`
										});
									}

								});
							}
						}

					}
				})
			} else if (uploadValue == false) {
				fs.unlink(FILE_LOCATION + 'public/upload/documents/' + userId + '/' + image, function (err) {
				//fs.unlink(constant.FILE_LOCATION + 'public\\upload\\marklist\\' + userId + '\\' + image, function (err) {
					if (err) {
						return res.json({
							status: 400,
							message: `Error occured in uploading document.`
						});
					} else {
						return res.json({
							status: 401,
							message: 'You have uploaded the Password Protected Document. Please Upload correct document.'
						});
					}
				});
			}
		}
	});
});

router.post('/upload_transcript',function(req,res){
    var userId = req.query.user_id;
	var image;
	var transcript_name = req.query.transcript_name;
	var transcript_doc = req.query.hiddentype;
	var dir = FILE_LOCATION + "public/upload/documents/" + userId;
	var doc_id = req.query.doc_id;
	var app_id = req.query.app_id;
	var ext;
	var provisional;
	var degree_type = req.query.degree_type;
	var degreeValue = req.query.degreeValue;
    var source = req.query.source;
	if(degreeValue){
		if(degreeValue == 'Provisional Degree Certificate'){
			provisional = true
		}else{
			provisional = false
		}
	}else{
		provisional = false
	}
	
	let Appliedfor = functions.getAttestationFor(userId,source);
    if(Appliedfor.instructionalField == true || Appliedfor.instructionalField == 1){
        source = 'gumoi'
    }else{
        source = 'guattestation'
    }
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
  	var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, FILE_LOCATION+'public/upload/documents/'+userId);
		},
		filename: function(req, file, callback) {
			var extension = path.extname(file.originalname)
			var randomString = functions.generateRandomString(10,'alphabetic')
			var newFileName = randomString.concat(extension);
			image = newFileName;
			callback(null, newFileName);

		}
	});

	var upload = multer({
		storage: storage,
		fileFilter: function (req, file, callback) {
			ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.JPEG' && ext !== '.PDF') {
				return callback(res.end('Please upload your document in .pdf, .jpeg, .jpg or .png formats only'), null)
			}
			callback(null, true)
		}
	}).single('file');
	upload(req, res, function (err, data) {
		imageLocationToCallClient = image;
		if (ext == '.pdf') {
			fs.readFile(FILE_LOCATION +'public/upload/documents/' + userId + '/' + image, (err, pdfBuffer) => {
				new pdfreader.PdfReader().parseBuffer(pdfBuffer, function (err, item) {
					if (err) {
						uploadValue = false;
						ValueUpdateData(uploadValue);
					} else if (!item) {
						uploadValue = true;
						ValueUpdateData(uploadValue);
					} else if (item.text) {}
				});
			});
		} else {
			uploadValue = true;
			ValueUpdateData(uploadValue);
		}

		function ValueUpdateData(uploadValue) {
			if (uploadValue == true) {
			
				if(transcript_name != 'Aadhar Card' && transcript_name !='Bonafied'){
					var fileStatus = false;
					models.User_Transcript.findAll({
						where :{
							user_id: userId,
						}
					}).then((datam)=>{
						if(datam.length > 0){
							datam.forEach(function(marklistData){
								if(marklistData){
									if(marklistData.file_name == imageLocationToCallClient){
										fileStatus=true;
									}
								}
							})
						}
						if(fileStatus==true){
							res.json({
								status: 200,
								message: `File already exist. please upload another file!!!..`,
							})
						}else{
							if(doc_id != undefined && doc_id != null && doc_id != ''){
								models.User_Transcript.findOne({
									where :{
										id : doc_id
									}
								}).then(function(transcriptUpload){
									transcriptUpload.update({
										file_name: imageLocationToCallClient,
										lock_transcript : false,
										upload_step : 'changed',
										provisional : provisional
									}).then(function(updatedtranscriptUpload){
										if (updatedtranscriptUpload) {
											models.Application.update(
												{status  : 'changed'},
												{where:
													{id  : app_id}
												}).then((err,updated)=>{
													if(err){
														console.error(err);
													}
														
													var desc ="Document named " +  updatedtranscriptUpload.name + " is being replaced "+"( "+ updatedtranscriptUpload.file_name+" )"+" by " + req.user.email
													var activity = "Re-upload Document";
													functions.activitylog(req,userId, activity, desc,app_id ,'GuAdmin');
													return res.json({
														status: 200,
														message: `Upload Completed.`,
														data : updatedtranscriptUpload
													});
												})
										
										} else {
											return res.json({
												status: 400,
												message: `Error occured in uploading document.`
											});
										}
									})
								})
							}else{
								if(app_id == null || app_id == '' || app_id == undefined){
									models.User_Transcript.create({
										name: transcript_name,
										user_id: userId,
										type: transcript_doc,
										file_name: imageLocationToCallClient,
										lock_transcript : false,
										collegeId : '1',
										provisional : provisional
									}).then(function (userTranscript) {
										if (userTranscript) {
											return res.json({
												status: 200,
												message: `Upload Completed.`,
												data : transcript_doc
											});
										} else {
											return res.json({
												status: 400,
												message: `Error occured in uploading document.`
											});
										}

									});
								}else{
									models.User_Transcript.create({
										name: transcript_name,
										user_id: userId,
										type: transcript_doc,
										file_name: imageLocationToCallClient,
										lock_transcript : false,
										collegeId : '1',
										upload_step : "changed",
										app_id : app_id,
										provisional : provisional
									}).then(function (userTranscript) {
										if (userTranscript) {
											return res.json({
												status: 200,
												message: `Upload Completed.`,
												data : transcript_doc
											});
										} else {
											return res.json({
												status: 400,
												message: `Error occured in uploading document.`
											});
										}

									});
								}
							}
						}
					})
				}else{
				
					if(transcript_name == 'Aadhar Card'){
						var fileStatus = false;
						models.Applicant_Marksheet.findAll({
							where :{
								user_id: userId,
								name : 'Aadhar Card'
					 		}
						}).then((datam)=>{
							if(datam.length > 0){
								datam.forEach(function(marklistData){
									if(marklistData){
										if(marklistData.file_name == imageLocationToCallClient){
											fileStatus=true;
										}
									}
								})
							}
							if(fileStatus==true){
								res.json({
									status: 200,
									message: `File already exist. please upload another file!!!..`,
								})
							}else{
								if(doc_id != undefined && doc_id != null && doc_id != ''){
									models.Applicant_Marksheet.findOne({
										where :{
											id : doc_id
										}
									}).then(function(transcriptUpload){
										transcriptUpload.update({
											file_name: imageLocationToCallClient,
											lock_transcript : false,
											upload_step : 'changed',
											provisional : provisional
										}).then(function(updatedtranscriptUpload){
											if (updatedtranscriptUpload) {
												models.Application.update(
													{status  : 'changed'},
													{where:
														{id  : app_id}
													}).then((err,updated)=>{
														if(err){
															console.error(err);
														}
															
														var desc ="Document named " +  updatedtranscriptUpload.name + " is being replaced "+"( "+ updatedtranscriptUpload.file_name+" )"+" by " + req.user.email
														var activity = "Re-upload Document";
														functions.activitylog(req,userId, activity, desc, '');
														return res.json({
															status: 200,
															message: `Upload Completed.`,
															data : updatedtranscriptUpload
														});
													})
											
											} else {
												return res.json({
													status: 400,
													message: `Error occured in uploading document.`
												});
											}
										})
									})
								}else{
									if(app_id == null || app_id == '' || app_id == undefined){
										models.Applicant_Marksheet.create({
											name: transcript_name,
											user_id: userId,
											type: transcript_doc,
											file_name: imageLocationToCallClient,
											lock_transcript : false,
											collegeId : '1',
											source : source
										}).then(function (userTranscript) {
											if (userTranscript) {
												return res.json({
													status: 200,
													message: `Upload Completed.`,
													data : transcript_doc
												});
											} else {
												return res.json({
													status: 400,
													message: `Error occured in uploading document.`
												});
											}
	
										});
									}else{
										models.Applicant_Marksheet.create({
											name: transcript_name,
											user_id: userId,
											type: transcript_doc,
											file_name: imageLocationToCallClient,
											lock_transcript : false,
											collegeId : '1',
											upload_step : "changed",
											app_id : app_id,
											source : source
										}).then(function (userTranscript) {
											if (userTranscript) {
												return res.json({
													status: 200,
													message: `Upload Completed.`,
													data : transcript_doc
												});
											} else {
												return res.json({
													status: 400,
													message: `Error occured in uploading document.`
												});
											}
	
										});
									}
								}
							}
						})
					}else{
						var fileStatus = false;
						models.Applicant_Marksheet.findAll({
							where :{
								user_id: userId,
								name : 'Bonafied'
					 }
						}).then((datam)=>{
							if(datam.length > 0){
								datam.forEach(function(marklistData){
									if(marklistData){
										if(marklistData.file_name == imageLocationToCallClient){
											fileStatus=true;
										}
									}
								})
							}
							if(fileStatus==true){
								res.json({
									status: 200,
									message: `File already exist. please upload another file!!!..`,
								})
							}else{
								if(doc_id != undefined && doc_id != null && doc_id != ''){
									models.Applicant_Marksheet.findOne({
										where :{
											id : doc_id
										}
									}).then(function(transcriptUpload){
										transcriptUpload.update({
											file_name: imageLocationToCallClient,
											lock_transcript : false,
											upload_step : 'changed',
											provisional : provisional
										}).then(function(updatedtranscriptUpload){
											if (updatedtranscriptUpload) {
												models.Application.update(
													{status  : 'changed'},
													{where:
														{id  : app_id}
													}).then((err,updated)=>{
														if(err){
															console.error(err);
														}
															
														var desc ="Document named " +  updatedtranscriptUpload.name + " is being replaced "+"( "+ updatedtranscriptUpload.file_name+" )"+" by " + req.user.email
														var activity = "Re-upload Document";
														functions.activitylog(req,userId, activity, desc, '');
														return res.json({
															status: 200,
															message: `Upload Completed.`,
															data : updatedtranscriptUpload
														});
													})
											
											} else {
												return res.json({
													status: 400,
													message: `Error occured in uploading document.`
												});
											}
										})
									})
								}else{
									if(app_id == null || app_id == '' || app_id == undefined){
										models.Applicant_Marksheet.create({
											name: transcript_name,
											user_id: userId,
											type: transcript_doc,
											file_name: imageLocationToCallClient,
											lock_transcript : false,
											collegeId : '1',
											source : source,
											applied_for_degree:degree_type
										}).then(function (userTranscript) {
											if (userTranscript) {
												return res.json({
													status: 200,
													message: `Upload Completed.`,
													data : transcript_doc
												});
											} else {
												return res.json({
													status: 400,
													message: `Error occured in uploading document.`
												});
											}
	
										});
									}else{
										models.Applicant_Marksheet.create({
											name: transcript_name,
											user_id: userId,
											type: transcript_doc,
											file_name: imageLocationToCallClient,
											lock_transcript : false,
											collegeId : '1',
											upload_step : "changed",
											app_id : app_id,
											source : source,
											applied_for_degree:degree_type
										}).then(function (userTranscript) {
											if (userTranscript) {
												return res.json({
													status: 200,
													message: `Upload Completed.`,
													data : transcript_doc
												});
											} else {
												return res.json({
													status: 400,
													message: `Error occured in uploading document.`
												});
											}
	
										});
									}
								}
							}
						})
					}
				}
						
			} else if (uploadValue == false) {
				fs.unlink(FILE_LOCATION + 'public/upload/documents/' + userId + '/' + image, function (err) {
					if (err) {
						return res.json({
							status: 400,
							message: `Error occured in uploading document.`
						});
					} else {
						return res.json({
							status: 401,
							message: 'You have uploaded the Password Protected Document. Please Upload correct document.'
						});
					}
				});
			}

		}
	});
});

router.get('/activityTracker',function(req, res){
    var userId = req.query.user_id;
    models.Activitytracker.findAll({
        where :{
            user_id : userId
        }
    }).then(activitytracker=>{
        if(activitytracker){
            res.json({
                status : 200,
                data : activitytracker
            })
        }else{
            res.json({
                status : 400    
            })
        }
       
    })
})


/*  Author : Priyanka Divekar
Route : Get all courses with duration,id short form, student_status 
Paramater :N/A*/

router.get('/getCourses',function(req, res){
    models.Program_List.findAll({
        order:[
            ['course_name','ASC']
        ],
        attributes:[    
            [Sequelize.fn('DISTINCT',Sequelize.col('course_name')),'name'],
            'duration',
            'id',
            'course_short_form',
            'student_status',
            'degree_type'
        ]
    }).then(courses=>{
        res.json({
            status : 200,
            data : courses
        })
    })
})

/*  Author : Priyanka Divekar
Route : Get all Colleges
Paramater :N/A*/

router.get('/getColleges',function(req, res){
    models.College.findAll({
        order:[
            ['name','ASC']
        ],
        attributes:[    
            [Sequelize.fn('DISTINCT',Sequelize.col('name')),'name'],
        ]
    }).then(courses=>{
        res.json({
            status : 200,
            data : courses
        })
    })
})

/*  Author : Priyanka Divekar
Route : Update student document details 
Paramater :service and changed details*/

router.post("/saveEduDetails", async (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  var source_from = req.body.source_from;
  var documentData = req.body.errataDetails;



  if (source_from == "guverification") {
    if (documentData.id) {
      let docDetails = await models.DocumentDetails.findOne({
        where: { id: documentData.id }
      });

      try {
        if (docDetails) {
          let updateDetails = await docDetails.update({
            courseName : documentData.courseName,
            courseType: documentData.courseType,
            seatNo: documentData.seatNo,
            semester: documentData.semester,
            PassingMonthYear: documentData.passingMonthYear,
            convocationDate: moment(
              new Date(documentData.convocationDate)
            ).format("YYYY-MM-DD"),
            resultClass: documentData.result,
            collegeName: documentData.collegeName,
            majorSubject: documentData.majorSubject,
            subsidarySubject: documentData.subsidarySubject,
            enrollmentStart: documentData.enrollmentStart,
            enrollmentEnd: documentData.enrollmentEnd,
            presubsidarySubject: documentData.presubsidarySubject,
            totalGrade: documentData.totalGrade,
            avgGrade: documentData.avgGrade,
            course_name: documentData.courseName.replace(/[&\/\\#+()$~%'":*?<>{}-\s]/g, '_'),
            degree_Type:documentData.degreeType

          });

          if (updateDetails) {
            models.Activitytracker.create({
                user_id: updateDetails.user_id,
                activity: "Edit Educational Details",
                data: req.user.email + " has been Edited Educational Details",
                application_id: updateDetails.app_id,
                source: 'guverification',
                ipAddress:clientIP,
              //   location:Location,
              //   ip_data:ipdata
              });
            res.json({
              status: 200,
              data: updateDetails,
            });
          } else {
            res.json({
              status: 400,
              data: documentData,
            });
          }
        } else {
          res.json({
            status: 404,
            msg: "document id is not found",
          });
        }
      } catch (e) {
      }
    }
  } else if (source_from == "gusyverification") {
    if (documentData.id) {
      let docDetails = await models.DocumentDetails.findOne({
        where: { id: documentData.id },
      });

      try {
        if (docDetails) {
          var flag = false;
          if (
            docDetails.collegeName != documentData.collegeName ||
            docDetails.courseName != documentData.courseName ||
            docDetails.enrollmentStart != documentData.enrollmentStart ||
            docDetails.enrollmentEnd != documentData.enrollmentEnd ||
            docDetails.majorSubject != documentData.majorSubject ||
            docDetails.subsidarySubject != documentData.subsidarySubject ||
            docDetails.presubsidarySubject != documentData.presubsidarySubject
          ) {
            flag = true;
          }

          if (flag == true) {
            let Details = await docDetails.update({
              PassingMonthYear: documentData.passingMonthYear,
              resultClass: documentData.result,
            });

            let docDetails1 = await models.DocumentDetails.update(
              {
                collegeName: documentData.collegeName,
                courseName : documentData.courseName,
                majorSubject: documentData.majorSubject,
                subsidarySubject: documentData.subsidarySubject,
                presubsidarySubject: documentData.presubsidarySubject,
                enrollmentStart: documentData.enrollmentStart,
                enrollmentEnd: documentData.enrollmentEnd,
                course_name: documentData.courseName.replace(/[&\/\\#+()$~%'":*?<>{}-\s]/g, '_')
              },
              {
                where: {
                  user_id: docDetails.user_id,
                  app_id: docDetails.app_id,
                },
              }
            );
            if (docDetails) {
               
              models.Activitytracker.create({
                user_id: docDetails.user_id,
                activity: "Edit Educational Details",
                data: req.user.email + " has been Edited Educational Details",
                application_id: docDetails.app_id,
                source: 'gusyverification',
                ipAddress:clientIP,
                // location:Location,
                // ip_data:ipdata
              });

              res.json({
                status: 200,
                data: docDetails1,
              });
            } else {
              res.json({
                status: 400,
                data: documentData,
              });
            }
          } else {
            let docDetails2 = await docDetails
              .update({
                PassingMonthYear: documentData.passingMonthYear,
                resultClass: documentData.result,
              })

            if (docDetails2) {
               
              models.Activitytracker.create({
                user_id: docDetails2.user_id,
                activity: "Edit Educational Details",
                data: req.user.email + " has been Edited Educational Details",
                application_id: docDetails2.app_id,
                source: 'gusyverification',
                ipAddress:clientIP,
                // location:Location,
                // ip_data:ipdata
              });
              res.json({
                status: 200,
                data: docDetails2,
              });
            } else {
              res.json({
                status: 400,
                data: documentData,
              });
            }
          }
        } else {
        }
      } catch (e) {
      }
    }
  }
});

router.post('/saveInsDetails', async (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  var source_from = req.body.source_from;
  var documentData = req.body.errataDetails;
  var address = [];
  if(documentData.address != ''){
    address.push({
        app_type : "new",
        address :  documentData.address
    })
 }else{
    address = null;
}
  if (source_from == 'guverification') {
    if (documentData.id) {
      let InsDetails = await models.InstituteDetails.findOne({
        where: { id: documentData.id }
      })
      try {
        if (InsDetails) {
          let UpdateInsDetails = await InsDetails.update({
            referenceNo: documentData.referenceNo,
            name: documentData.name.replace(/[^a-zA-Z0-9/ ]/g, ' '),
            address: address,
            email: documentData.email
          })
          if (UpdateInsDetails) {
            models.Activitytracker.create({
              user_id: UpdateInsDetails.user_id,
              activity: "Edit Institute Details",
              data: req.user.email + " has been Edited Institute Details",
              application_id: UpdateInsDetails.app_id,
              source: 'guverification',
              ipAddress:clientIP,
            //   location:Location,
            //   ip_data:ipdata
            });
            res.json({
              status: 200,
              data: UpdateInsDetails
            })

          }
          else {
            res.json({
              status: 400,
              data: documentData
            })
          }
        }

      }
      catch (e) {
      }

    }



  } else if (source_from == 'gusyverification') {

    if (documentData.id) {
      let InsDetails = await models.InstituteDetails.findOne({
        where: { id: documentData.id }
      })
      try {
        if (InsDetails) {
          let UpdateInsDetails = await InsDetails.update({
            referenceNo: documentData.referenceNo,
            name: documentData.name.replace(/[^a-zA-Z0-9 ]|\//g, ' '),
            address: address,
            email: documentData.email,
            emailasperwes:documentData.emailaswes,
            nameasperwes:documentData.nameaswes,
            surnameasperwes:documentData.surnameaswes

          })
          if (UpdateInsDetails) {
            models.Activitytracker.create({
              user_id: UpdateInsDetails.user_id,
              activity: "Edit Institute Details",
              data: req.user.email + " has been Edited Institute Details",
              application_id: UpdateInsDetails.app_id,
              source: 'gusyverification',
              ipAddress:clientIP,
            //   location:Location,
            //   ip_data:ipdata
            });
            res.json({
              status: 200,
              data: UpdateInsDetails
            })
          }
          else {
            res.json({
              status: 400,
              data: documentData
            })
          }
        }

      }
      catch (e) {
      }

    }

  }

});

router.post('/addInsDetails', async (req, res) => {
    try {
      const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const { app_id, user_id, errataDetails } = req.body;
  
      const address = errataDetails.address ? [{ app_type: 'new', address: errataDetails.address }] : null;
  
      const vt = await models.VerificationTypes.findOne({
        where: {
          user_id: user_id,
          source_from: 'guverification',
          app_id: app_id,
        },
      });
  
      let deliveryOption = vt.sealedCover ? 'Physical' : 'Digital';
  
      if (vt) {
        const addIns = await models.InstituteDetails.create({
          referenceNo: errataDetails.referenceNo,
          name: errataDetails.name.replace(/[^a-zA-Z0-9 ]|\//g, ' '),
          address: address,
          email: errataDetails.email,
          type: errataDetails.selectType,
          deliveryOption: deliveryOption,
          deliveryMode: 'Normal',
          user_id: user_id,
          app_id: app_id,
        });
  
        if (addIns) {
          const data1 = `${req.user.email} has added Institute Details`;
          const activity = 'Added Institute Details';
          functions.activitylog(clientIP, req, user_id, activity, data1, app_id, 'guverification');
          res.json({
            status: 200,
            data: addIns,
          });
        } else {
          res.json({
            status: 400,
            data: errataDetails,
          });
        }
      } else {
        res.json({
          status: 400,
          message: 'VerificationType not found.',
        });
      }
    } catch (e) {
      console.error('Error:', e);
      res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
      });
    }
});

router.post('/saveAddDetails', (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var documentData = req.body.documentDetailsData;
    var source_from = req.body.source_from;
    var type = req.body.type;
    var app_id = req.body.app_id;
    var user_id = req.body.user_id;
    if(source_from == 'guverification'){
        models.DocumentDetails.create({
            courseName : documentData.courseName,
            courseType: documentData.courseType,
            seatNo: documentData.seatNo,
            semester: documentData.semester,
            PassingMonthYear : documentData.passingMonthYear,
            convocationDate: (documentData.convocationDate) ? (moment(new Date(documentData.convocationDate)).format('YYYY-MM-DD')) : null,
            resultClass: documentData.result,
            type: type,
            collegeName: documentData.collegeName,
            majorSubject: documentData.majorSubject,
            subsidarySubject: documentData.subsidarySubject,
            enrollmentStart: documentData.enrollmentStart,
            enrollmentEnd: documentData.enrollmentEnd,
            presubsidarySubject: documentData.presubsidarySubject,
            user_id:user_id,
            app_id:app_id, 
            course_name: documentData.courseName.replace(/[&\/\\#+()$~%'":*?<>{}-\s]/g, '_'),
            degree_Type:documentData.degreeType
            
        }).then(function(documentDetails) {
            models.VerificationTypes.findOne({
                where:{
                    app_id : app_id
                }
            }).then((vt)=>{
                if(type == 'marksheet'){
                    if(vt.transcript == true && vt.marksheet != true){
                        vt.update({
                            marksheet : true,
                            noOfMarksheet : 1
                        })
                    }else{
                        
                        var noOfDocs = parseInt(vt.noOfMarksheet) + 1;
                        vt.update({
                            marksheet : true,
                            noOfMarksheet : noOfDocs
                        })
                    }
                }else if(type == 'transcript'){
                    var noOfDocs = parseInt(vt.noOfTranscript) + 1;
                    vt.update({
                        transcript : true,
                        noOfTranscript : noOfDocs
                    })
                }else if(type == 'degree'){
                    var noOfDocs = parseInt(vt.noOfDegree) + 1;
                    vt.update({
                        degreeCertificate : true,
                        noOfDegree : noOfDocs
                    })
                }
                models.Activitytracker.create({
                    user_id : documentDetails.user_id,
                    activity : "Add Educational Details",
                    data : req.user.email + "has been Added Educational Details" ,
                    application_id : documentDetails.app_id,
                    source :'guverification',
                    ipAddress:clientIP
                });

                res.json({
                status: 200,
                data: documentDetails
                })
            })

        }).catch(error => {
            res.status(400).json({
            status: 400,
            message: 'Error creating document'
            });
        });
    }else if(source_from == 'gusyverification'){
       models.DocumentDetails.create({
              id:documentData.doc_id,
              courseName : documentData.courseName,
              courseType: documentData.courseType,
              seatNo: documentData.seatNo,
              semester: documentData.semester,
              PassingMonthYear : documentData.passingMonthYear,
              convocationDate: (documentData.convocationDate) ? (moment(new Date(documentData.convocationDate)).format('YYYY-MM-DD')) : null,
              resultClass: documentData.result,
              type:type,
              collegeName: documentData.collegeName,
              majorSubject: documentData.majorSubject,
              subsidarySubject: documentData.subsidarySubject,
              enrollmentStart: documentData.enrollmentStart,
              enrollmentEnd: documentData.enrollmentEnd,
              presubsidarySubject: documentData.presubsidarySubject,
              user_id:user_id,
              app_id:app_id,
              course_name : documentData.courseName.replace(/[&\/\\#+()$~%'":*?<>{}-]/g, '_'),
              
            }).then(function(documentDetails) {
              models.Activitytracker.create({
                  user_id : documentDetails.user_id,
                  activity : "Add Educational Details",
                  data : req.user.email + " has been Added Educational Details" ,
                  application_id : documentDetails.app_id,
                  source :'gusyverification',
                  ipAddress:clientIP
                });
      
              res.json({
                status: 200,
                data: documentDetails
              })
            }).catch(error => {
              res.status(400).json({
                status: 400,
                message: 'Error creating document'
              });
            });
          }
  });






router.get('/courseDetails',(req,res,next)=>{
    models.Program_List.findAll({
        where:{
            course_name : req.query.course
        }
    }).then(courses=>{
        if(courses){
            var duration = courses[0].duration
            var patternArr = [];
            if(req.query.pattern == 'Annual'){
                for(var i=1; i <=duration; i++){
                    var number = converter.toWordsOrdinal(i);
                    var number = number.charAt(0).toUpperCase() + number.slice(1).toLowerCase();
                    patternArr.push({
                        term_name : number + ' Year'
                    })
                }
            }else if(req.query.pattern == 'Semester'){
                duration = duration * 2;
                for(var i=1; i <=duration; i++){
                    var sem = romans.romanize(i)
                    patternArr.push({
                        term_name : 'Semester ' + sem
                    })
                }
            }
            res.json({
                status : 200,
                data : patternArr
            })
        }
    })
})


/*  Author : Priyanka Divekar
Route : Upload changed document
Paramater :user id, service, document id, file to be upload*/

router.post('/uploadDocument',  (req,res,next)=>{
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var image;
    var userId = req.query.user_id;
    var source = req.query.source;
    var app_id = req.query.app_id;
    var doc_id = req.query.doc_id;
    var uploadType = req.query.uploadType;
    var supportDoc = req.query.supportDoc;
    var dir = FILE_LOCATION + "public/upload/documents/" + userId; 
    if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
    
    var ext;
    var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, FILE_LOCATION+'public/upload/documents/'+userId);
		},
		filename: function(req, file, callback) {
			var extension = path.extname(file.originalname)
			var randomString = functions.generateRandomString(10,'alphabetic')
			var newFileName = randomString.concat(extension); 
            image = newFileName;
			callback(null, newFileName);
			
		}
	});

	var upload = multer({
		storage: storage,
		fileFilter: function (req, file, callback) {
			ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.JPEG' && ext !== '.PDF') {
				return callback(res.end('Please upload your document in .pdf, .jpeg, .jpg or .png formats only'), null)
			}
			callback(null, true)
		}
	}).single('file');

    upload(req, res, function (err, data) {
		imageLocationToCallClient = image;
		if (ext == '.pdf') {
			fs.readFile(FILE_LOCATION +'public/upload/documents/' + userId + '/' + image, (err, pdfBuffer) => {
			    new pdfreader.PdfReader().parseBuffer(pdfBuffer, function (err, item) {
					if (err) {
						uploadValue = false;
						ValueUpdateData(uploadValue);
					} else if (!item) {
						uploadValue = true;
						ValueUpdateData(uploadValue);
					} else if (item.text) {}
				});
			});
		} else {
			uploadValue = true;
			ValueUpdateData(uploadValue);
		}

		function ValueUpdateData(uploadValue) {
			if (uploadValue == true) {
                if(supportDoc == 'true'){
                    models.DocumentDetails.create({
                        courseName : req.query.courseName,
                        semester : req.query.semester,
                        file : image,
                        user_id : userId,
                        app_id : app_id,
                        type : req.query.type,
                        degree_Type : (req.query.degree_type) ? req.query.degree_type : null,
                        course_name : req.query.courseName.replace(/[&\/\\#+()$~%'":*?<>{}-\s]/g, '_'),
                    }).then(function(createdDoc){
                        if(req.query.type == 'marksheet'){
                            var total = 1;
                            models.VerificationTypes.findOne({
                                where:{
                                    app_id : app_id,
                                    user_id : userId
                                }
                            }).then(function(vt){

                                total += vt.noOfMarksheet;
                                vt.update({
                                    noOfMarksheet : total
                                })
                            })
                        }
                        models.Activitytracker.create({
                            user_id: userId,
                            activity: "Upload Document",
                            data: req.user.email + " has been added supporting document - " + req.query.courseName + req.query.semester,
                            application_id: app_id,
                            source: source,
                            ipaddress:clientIP,
                            // location:Location,
                            // ip_data:ipdata
                        }).then((activity)=>{
                            return res.json({
                                status: 200,
                                message: `Upload Completed.`,
                                data : createdDoc
                            });
                        })
                    
                    })
                }else{
                    if(source == 'guverification' || source == 'gusyverification'){ 
                        models.DocumentDetails.update(
                            {
                                file : image
                            },{
                            where:{
                                id : doc_id
                            }
                        }).then(function(documentDetails){
                            if (documentDetails) {
                                if(uploadType == 'edit'){
                                    models.Activitytracker.create({
                                        user_id: userId,
                                        activity: "Re-upload Documents",
                                        data: req.user.email + " has been re-uploaded document for document id " + doc_id,
                                        application_id: app_id,
                                        source: source,
                                        ipaddress:clientIP,
                                        // location:Location,
                                        // ip_data:ipdata
                                    })
                                }else{
                                    models.Activitytracker.create({
                                        user_id: userId,
                                        activity: "Upload Document",
                                        data: req.user.email + " has been re-uploaded document for document id " + doc_id,
                                        application_id: app_id,
                                        source: source,
                                        ipaddress:clientIP,
                                        // location:Location,
                                        // ip_data:ipdata
                                    })
                                }
                                return res.json({
                                    status: 200,
                                    message: `Upload Completed.`,
                                    data : documentDetails
                                });
                            } else {
                                return res.json({
                                    status: 400,
                                    message: `Error occured in uploading document.`
                                });
                            }
                        })
                    }
                }
                
			} else if (uploadValue == false) {

				fs.unlink(FILE_LOCATION + 'public/upload/documents/' + userId + '/' + image, function (err) {
                    if (err) {
                        return res.json({
                            status: 400,
                            message: `Error occured in uploading document.`
                        });
                    } else {
                        return res.json({
                            status: 401,
                            message: 'You have uploaded the Password Protected Document. Please Upload correct document.'
                        });
                    }
                });
			}
		}
	});

})

router.post('/saveinstitutiondetails', async (req, res) => {
    var id = req.body.id
    var value = req.body.value
    var informadmin = req.body.informadmin
    var app_id = req.body.app_id
    var adminemail = req.body.Adminemail

    var updateinstruct = await functions.saveinstitutiondetails(id,value);
    if(informadmin == true && value.purpose == 'Educational credential evaluators WES'){ 

         models.Application.update({
            wes_error : 'Wes Details Updated'
        },{
            where:{
                id : app_id
            }
        });
    }
    if(updateinstruct){
        var desc = "Institution Details of " + req.body.app_id + " Edited " + " by "+  adminemail;
        var activity = "Institution Details Update";
        functions.activitylog(req,req.body.user_id, activity, desc, req.body.app_id, 'guAdmin');
        res.json({
            status:200
        })
    }else{
        res.json({
            status:400
        })
    }
})

router.post('/RemoveCurrentYear',async(req,res)=>{
    remove = await functions.removeCurrentYear(req.body.app_id,req.body.value);
        if(remove){
            var desc = "Current Year of  " + req.body.app_id + " removed " + " by "+  req.user.email;
            var activity = req.body.value+" Year Removed";
            functions.activitylog(req,req.body.user_id, activity, desc, req.body.app_id, 'guAdmin');
            res.json({
                status : 200
            })
        }else{
            res.json({
                status  : 400
            })
        }
})

router.get('/getParticularInstitutionDetails',(req,res)=>{
    var purpose = []
    var id = req.query.id;
    models.Institution_details.getInstituteDataone(id).then(function(institution){
        institution.forEach(institution=>{
            if(institution.type == 'study'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.studyrefno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A',
                    institution_name: institution.university_name ? institution.university_name :  'N.A',
                    contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                    country_name: institution.country_name ? institution.country_name :  'N.A',
                    contact_person: institution.contact_person ? institution.contact_person :  'N.A',

                })
            }
            if(institution.type == 'employment'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.emprefno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                     email  : institution.email ? institution.email :  'N.A',
                     institution_name: institution.university_name ? institution.university_name :  'N.A',
                     contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                     country_name: institution.country_name ? institution.country_name :  'N.A', 
                     contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                })
            }
            if(institution.type == 'IQAS'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.iqasno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
            if(institution.type == 'CES'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.cesno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
            if(institution.type == 'ICAS'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.icasno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
            if(institution.type == 'visa'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.visarefno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A',
                    institution_name: institution.university_name ? institution.university_name :  'N.A',
                    contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                    country_name: institution.country_name ? institution.country_name :  'N.A',
                    contact_person: institution.contact_person ? institution.contact_person :  'N.A',

                })
            }
                
            if(institution.type == 'MYIEE'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.myieeno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
            if(institution.type == 'ICES'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.icesno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
            if(institution.type == 'NASBA'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.nasbano,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
            if(institution.type == 'Educational Perspective'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.eduperno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
            if(institution.type == 'NCEES'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.nceesno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
            if(institution.type == 'NARIC'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.naricno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }

            if(institution.type == 'National Committee on Accreditation'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.ncano,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
            if(institution.type == 'The National Dental Examining Board of Canada'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.ndebno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
            if(institution.type == 'Educational credential evaluators WES'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.wesno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.emailAsWes ? institution.emailAsWes :  'N.A',
                    NameasWes:institution.nameaswes ,
                    Surnameaswe:institution.lastnameaswes 
                })
            }
            if(institution.type == 'HRD'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.hrdno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
            if(institution.type == 'CAPR'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.caprno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
            if(institution.type == 'dembassy'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.dembassyno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }   
            if(institution.type == 'others'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.otheraccno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A',
                    institution_name: institution.university_name ? institution.university_name :  'N.A',
                    contact_number: institution.contact_number ? institution.contact_number :  'N.A',
                    country_name: institution.country_name ? institution.country_name :  'N.A',
                    contact_person: institution.contact_person ? institution.contact_person :  'N.A',
                })
            }
            if(institution.type == 'Educational Credential Evaluators (ECE)'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : institution.ecerefno,
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
            if(institution.type == 'pickup'){
                purpose.push({
                    id:institution.id,
                    app_id:institution.app_id,
                    type : institution.type,
                    referenceNo : 'N.A',
                    deliveryType  :  institution.deliveryType ? institution.deliveryType :  'N.A',
                    deliveryAddress :  institution.address ? institution.address : 'N.A',
                    email  : institution.email ? institution.email :  'N.A'
                })
            }
                
        })
            if(purpose){
                res.json({
                    data :  purpose
                })
            }else{
                res.json({
                data  : null
                })
            }
        })
})

router.get('/download',getUserRole,function (req, res) {
    var applicationData = [];
    var source_from=req.query.source_from
    var startDate = (req.query.startDate) ? moment(new Date(req.query.startDate)).format("YYYY-MM-DD") : '';
    var endDate = (req.query.endDate) ? moment(new Date(req.query.endDate)).add(1,'days').format("YYYY-MM-DD") : '';
        models.Application.download(req.superRoles,startDate, endDate,source_from).then(function(data){
            require('async').eachSeries(data,function(data,callback){
                applicationData.push({
                    'ApplicationId': data.app_id,
                    'Full Name': (data.marksheetName) ? data.marksheetName : data.fullname,
                    'Email': data.email,
                    'mobile no': data.contactNumber,
                    'Service':data.Service,
                    'Status': data.STATUS,
                    'Tracker' : data.tracker
                });
                callback();
            },function(){
                setTimeout(function () {
                    var xls = json2xls(applicationData);
                    fs.writeFileSync(FILE_LOCATION + "public/Excel/" + "TotalApplication.xlsx", xls, 'binary');
                    var filepath = FILE_LOCATION + "public/Excel/" +  "TotalApplication.xlsx";
    
                    res.json({
                        status: 200,
                        data: filepath
                    });
    
          }, 1300);
            })
        })

   
});


router.get('/download_notesNull' , async function (req, res) {
    let finalData = [];
    let ApplicationData = await functions.getExcelDataApplication();
    let promises = ApplicationData.map(async (appData) => {
        let Userdata = await functions.getuserdetail(appData.user_id);
        if(appData.source_from == 'guattestation' || appData.source_from == 'gumoi'){
        let appliedData = await functions.getExcelDataAppliedFor(appData.id);
        let purposeData = await functions.getExcelDataPurpose(appData.id);
        let degree = '';
        let purposeDetails = '';

        if ( appliedData && appliedData.applying_for == 'Phd,Masters,Bachelors') {
            degree = 'Phd'
        } else if (appliedData && appliedData.applying_for == 'Phd') {
            degree = 'Phd,Masters,Bachelors'
        } else {
            degree = appliedData && appliedData.applying_for ? appliedData.applying_for : 'N.A'
        }
        
        for(let j = 0 ; j < purposeData.length ; j++){
            if(purposeData[j].deliveryType == 'physcial'){
                purposeDetails += ',' + purposeData[j].type + '(' + purposeData[j].noofcopies+ ')'
            }else{
                if(purposeData[j].type == 'Educational credential evaluators WES'){
                    purposeDetails += purposeData[j].type
                }else{
                    purposeDetails += purposeData[j].type + '(' + purposeData[j].email+ ')'
                }
            }
        }
        finalData.push({
            app_id: appData.id,
            Amount: appData.total_amount,
            ApplicationDate: moment(new Date(appData.created_at)).format('DD-MM-YYYY'),
            source: appData.source_from,
            DeliveryType: appData.deliveryType,
            StudentName: Userdata && Userdata.name ? Userdata.name : 'N.A',
            StudentEmail: Userdata && Userdata.email ? Userdata.email : 'N.A',
            StudentMobile:Userdata && Userdata.mobile ? Userdata.mobile : 'N.A',
            AppliedForDegree: degree,
            AttestedFor: appliedData && appliedData.attestedfor ? appliedData.attestedfor : 'N.A',
            Attestation_purpose : purposeDetails,
            Verification_purpose : null
        });
        }
        if(appData.source_from == 'guverification' || appData.source_from == 'gusyverification'){
        let appliedData = await functions.getDataAppliedFor(appData.id);
        let purposeData = await functions.getDataPurpose(appData.id);
        let verificationtypesData = await functions.getDataverificationtypes(appData.id);
        let degreeData;
        let degree_type = '';
        if(appliedData != null){
            degreeData = await functions.getDatadegree(appliedData.courseName);
        }
        if(degreeData != null){
            degree_type += degreeData.degree_type ;

        }
        let deliveryOption = '';
        let purposeDetails = '';
        let documentType = '';
        if(verificationtypesData && verificationtypesData.marksheet == true){
           documentType += 'marksheet' + ','
        }
        if(verificationtypesData && verificationtypesData.transcript == true){
            documentType += 'transcript' + ','
        }
        if(verificationtypesData && verificationtypesData.degreeCertificate == true){
            documentType += 'degree' 
        }
        if(verificationtypesData && verificationtypesData.secondYear == true){
            documentType += 'secondYear' 
        }

        for(let j = 0 ; j < purposeData.length ; j++){
            if(purposeData[j].deliveryOption == 'physcial' && verificationtypesData.sealedCover == true){
                purposeDetails = purposeData[j].name + '(' + verificationtypesData.noOfCopies+ ')'
               
            }else{
                purposeDetails =  purposeData[j].name + '(' +  purposeData[j].email + ')'
            }
            deliveryOption = purposeData[j].deliveryOption;
        }
        finalData.push({
            app_id: appData.id,
            Amount: appData.total_amount,
            ApplicationDate: moment(new Date(appData.created_at)).format('DD-MM-YYYY'),
            source: appData.source_from,
            DeliveryType: deliveryOption ? deliveryOption : 'N.A',
            StudentName: Userdata && Userdata.name ? Userdata.name : 'N.A',
            StudentEmail: Userdata && Userdata.email ? Userdata.email : 'N.A',
            StudentMobile:Userdata && Userdata.mobile ? Userdata.mobile : 'N.A',
            AppliedForDegree: degree_type ? degree_type : 'N.A',
            AttestedFor: documentType ? documentType : 'N.A',
            Attestation_purpose : null,
            Verification_purpose : purposeDetails
        });
        }
        
    });
    
    Promise.all(promises).then(() => {
        setTimeout(function () {
            var xls = json2xls(finalData);
            fs.writeFileSync(FILE_LOCATION + "public/Excel/" + "TotalApplication_notesnull.xlsx", xls, 'binary');
            var filepath = FILE_LOCATION + "public/Excel/" + "TotalApplication_notesnull.xlsx";
    
            res.json({
                status: 200,
                data: filepath
            });
        }, 1300);
    }).catch((error) => {
        console.error(error);
    });
});

router.get('/getusermarklist',async function (req, res) {
    var id = req.query.user_id
    var type = req.query.type
    var app_id = req.query.app_id
 
 var usermarklist = await functions.getmarklistdetails(type,id,app_id);
if(usermarklist){
    res.json({
        usermarklist:usermarklist,
        status:200
    })
}else{
    res.json({
        status:400
    })
}
})

router.post('/upload_transcript_Admin',function(req,res){
    var userId = req.query.user_id;
	var image;
	var transcript_name = req.query.transcript_name;
	var transcript_doc = req.query.hiddentype;
	var dir = FILE_LOCATION + "public/upload/documents/" + userId;
	var doc_id = req.query.doc_id;
	var app_id = req.query.app_id;
	var ext;
	var provisional;
	var degree_type = req.query.degree_type;
	var degreeValue = req.query.degreeValue;
    var source = req.query.source;
    var Degree = req.query.Degree;
	if(degreeValue){
		if(degreeValue == 'Provisional Degree Certificate' || degreeValue == 'Internship Completion Certificate' || degreeValue == 'WES Confirmation of Doctoral Degree Conferral / Academic Records Request Form'){
			provisional = true
		}else{
			provisional = false
		}
	}else{
		provisional = false
	}
	
	let Appliedfor = functions.getAttestationFor(userId,source);
    if(Appliedfor.instructionalField == true || Appliedfor.instructionalField == 1){
        source = 'gumoi'
    }else{
        source = 'guattestation'
    }
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
  	var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, FILE_LOCATION+'public/upload/documents/'+userId);
		},
		filename: function(req, file, callback) {
			var extension = path.extname(file.originalname)
			var randomString = functions.generateRandomString(10,'alphabetic')
			var newFileName = randomString.concat(extension);
			image = newFileName;
			callback(null, newFileName);

		}
	});

	var upload = multer({
		storage: storage,
		fileFilter: function (req, file, callback) {
			ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.JPEG' && ext !== '.PDF') {
				return callback(res.end('Please upload your document in .pdf, .jpeg, .jpg or .png formats only'), null)
			}
			callback(null, true)
		}
	}).single('file');
	upload(req, res, function (err, data) {
		imageLocationToCallClient = image;
		if (ext == '.pdf') {
			fs.readFile(FILE_LOCATION +'public/upload/documents/' + userId + '/' + image, (err, pdfBuffer) => {
				new pdfreader.PdfReader().parseBuffer(pdfBuffer, function (err, item) {
					if (err) {
						uploadValue = false;
						ValueUpdateData(uploadValue);
					} else if (!item) {
						uploadValue = true;
						ValueUpdateData(uploadValue);
					} else if (item.text) {}
				});
			});
		} else {
			uploadValue = true;
			ValueUpdateData(uploadValue);
		}

		function ValueUpdateData(uploadValue) {
                if(degreeValue == 'bonafied' ){
                    models.Applicant_Marksheet.create({
                        name: 'Bonafied',
                        user_id: userId,
                        type: 'Bonafied',
                        file_name: imageLocationToCallClient,
                        lock_transcript : false,
                        applied_for_degree : Degree,
                        source : 'gumoi'
                    }).then(function (userTranscript) {
                        if (userTranscript) {
                            var desc ="New Document named " +  userTranscript.name + " Added "+"( "+ userTranscript.file_name+" )"+" by " + req.user.email
					        var activity = "Upload Document";
					        functions.activitylog(req,userId, activity, desc,app_id ,'GuAdmin');
                            return res.json({
                                status: 200,
                                message: `Upload Completed.`,
                                data : transcript_doc
                            });
                        } else {
                            return res.json({
                                status: 400,
                                message: `Error occured in uploading document.`
                            });
                        }

                    });
            }else if(degreeValue == 'extraBonafied'){
                models.Applicant_Marksheet.create({
                    name: 'extraBonafied',
                    user_id: userId,
                    type: 'Bonafied',
                    file_name: imageLocationToCallClient,
                    lock_transcript : false,
                    applied_for_degree : Degree,
                    source : 'gumoi'
                }).then(function (userTranscript) {
                    if (userTranscript) {
                        var desc ="New Document named " +  userTranscript.name + " Added "+"( "+ userTranscript.file_name+" )"+" by " + req.user.email
                        var activity = "Upload Document";
                        functions.activitylog(req,userId, activity, desc,app_id ,'GuAdmin');
                        return res.json({
                            status: 200,
                            message: `Upload Completed.`,
                            data : transcript_doc
                        });
                    } else {
                        return res.json({
                            status: 400,
                            message: `Error occured in uploading document.`
                        });
                    }

                });
            }
            else{
			models.User_Transcript.create({
				name: transcript_name,
				user_id: userId,
				type: transcript_doc,
				file_name: imageLocationToCallClient,
				lock_transcript : false,
				collegeId : '1',
				provisional : provisional,
				app_id : app_id,
                degreeType : degreeValue,
                source : 'guattestation'
			}).then(function (userTranscript) {
				if (userTranscript) {
                    var desc ="New Document named " +  userTranscript.name + " Added "+"( "+ userTranscript.file_name+" )"+" by " + req.user.email
					var activity = "New Upload Document";
					functions.activitylog(req,userId, activity, desc,app_id ,'GuAdmin');
					return res.json({
						status: 200,
						message: `Upload Completed.`,
						data : transcript_doc
					});
				} else {
					return res.json({
						status: 400,
						message: `Error occured in uploading document.`
					});
				}

			})
            }
		}
	});
});

router.post('/uploadUserMarkList_Admin',function(req,res){
	var userId = req.query.user_id;
	var image;
	var transcript_name = req.query.transcript_name;
	var education_type = req.query.education_type;
	var user_marklistid = req.query.user_marklistid;
	var app_id = (req.query.app_id) ? req.query.app_id : null;
	var fileStatus= false;
	var source= req.query.source;
	var doc_id = req.query.doc_id;
	var ext;
    
	var dir = FILE_LOCATION + "public/upload/documents/" + userId;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
  	var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, FILE_LOCATION+'public/upload/documents/'+userId);
		},
		filename: function(req, file, callback) {
			var extension = path.extname(file.originalname)
			var randomString = functions.generateRandomString(10,'alphabetic')
			var newFileName = randomString.concat(extension);
			image = newFileName;
			callback(null, newFileName);
		}
	});

	var upload = multer({
		storage: storage,
		fileFilter: function (req, file, callback) {
			ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.JPEG' && ext !== '.PDF') {
				return callback(res.end('Please upload your document in .pdf, .jpeg, .jpg or .png formats only'), null)
			}
			callback(null, true)
		}
	}).single('file');
	upload(req, res, function (err, data) {
		imageLocationToCallClient = image;
		if (ext == '.pdf') {
			fs.readFile(FILE_LOCATION +'public/upload/documents/' + userId + '/' + image, (err, pdfBuffer) => {
			//	fs.readFile(constant.FILE_LOCATION +'public\\upload\\marklist\\' + userId + '\\' + image, (err, pdfBuffer) => {
					new pdfreader.PdfReader().parseBuffer(pdfBuffer, function (err, item) {
					if (err) {
						uploadValue = false;
						ValueUpdateData(uploadValue);
					} else if (!item) {
						uploadValue = true;
						ValueUpdateData(uploadValue);
					} else if (item.text) {}
				});
			});
		} else {
			uploadValue = true;
			ValueUpdateData(uploadValue);
		}

		function ValueUpdateData(uploadValue) {
			models.UserMarklist_Upload.create({
				name: transcript_name,
				user_id: userId,
				user_marklist_id:req.query.user_marklistid,
				education_type: education_type,
				file_name: imageLocationToCallClient,
				lock_transcript : false,
				upload_step : "default",
                app_id  : app_id,
                source: source
			}).then(function (userMarklist) {
				if (userMarklist) {
                    var desc ="New Document named " +  userMarklist.name + " Added "+"( "+ userMarklist.file_name+" )"+" by " + req.user.email
					var activity = "New Markesheet Upload";
					functions.activitylog(req,userId, activity, desc,app_id ,'GuAdmin');
					return res.json({
						status: 200,
						message: `Upload Completed.`,
						data : userMarklist
					});
				} else {
					return res.json({
						status: 400,
						message: `Error occured in uploading document.`
					});
				}

			});
		}
	});
});

router.get('/getApplicationDetailsByUser_WesRangeWise',getUserRole,  function (req, res) {
    var students = [];
    var page = req.query.page;
    var id = req.query.id ? req.query.id : '';
    var name = req.query.name ? req.query.name : '';
    var email = req.query.email ? req.query.email : '';
    var source_from = req.query.source_from ? req.query.source_from : '';
    var tracker = req.query.tracker ? req.query.tracker : null;
    var status = req.query.status ? req.query.status : null;
    var limit = 10;
    var offset = (page - 1) * limit;
    var countObjects = {};
    var filters =[];

    if(id != '' && id != null && id != undefined && id != 'null' && id != 'undefined'){
        var filter ={};
        filter.name = 'application_id';
        filter.value = id;
        filters.push(filter);
    }

    if(name != '' && name != null && name != undefined && name != 'null' && name != 'undefined'){
        var filter ={};
        var filter1 = {};
        var nameSplit = name.split(' ');
        if(nameSplit.length == 1){
            filter.name = 'name';
            filter.value = " AND( usr.name like '%" + nameSplit[0] + "%' OR usr.surname like '%" + nameSplit[0] + "%') ";
            filters.push(filter);
        }else if(nameSplit.length == 2){
             filter.name = 'name';
            filter.value = " AND usr.name like '%" + nameSplit[0] + "%' AND usr.surname like '%" + nameSplit[1] + "%' ";
            filters.push(filter);
        }else{
             filter.name = 'name';
             var lastElement = nameSplit.pop();
            filter.value = " AND usr.name like '%" + nameSplit.join(' ') + "%' AND usr.surname like '%" + lastElement + "%' ";
            filters.push(filter);
        }

    }
    if(email != '' && email != null && email != undefined && email != 'null' && email != 'undefined'){
        var filter ={};
        filter.name = 'email';
        filter.value = email;
        filters.push(filter);
    }

    if(source_from != '' && source_from != null && source_from != undefined && source_from != 'null' && source_from != 'undefined'){
        var filter ={};
        filter.name = 'source_from';
        filter.value = source_from;
        filters.push(filter);
	}



   models.Application.getApplicationByUser_wesRangeWise(filters,tracker,status,null,null,req.superRoles,req.attest,req.verify,req.query.startDate,req.query.endDate).then(data1 => {
        countObjects.totalLength = data1.length;
        models.Application.getApplicationByUser_wesRangeWise(filters,tracker,status,limit,offset,req.superRoles,req.attest,req.verify,req.query.startDate,req.query.endDate).then(data => {
            countObjects.filteredLength = data.length;
            require('async').eachSeries(data1, function(student, callback){
                students.push({
                    'ApplicationId': student.app_id,
                    'Full Name': (student.NAME) ? student.NAME : student.marksheetName,
                    'Email': student.email,
                    'Service' : student.Service,
                    'WES No' : student.WES_No,
                    'Approved By' : student.verifiedBy,
                    'Verified By' : student.printBy,
                    'Created At' : moment((student.created_at)).format("YYYY-MM-DD"),
                    'OutwardNO' : student.outward
                });
                callback();
            }, function(){
                setTimeout(function () {
                    var xls = json2xls(students);
                    fs.writeFileSync(FILE_LOCATION + "/public/Excel/" + 'WESsent' + ".xlsx", xls, 'binary');
                    var filepath = FILE_LOCATION + "/public/Excel/" + 'WESsent' + ".xlsx";
                    res.json({
                        status: 200,
                        data: filepath
                    });
    
                }, 1300);
            });
        });
    });
});

router.get('/courseDetails',(req,res,next)=>{
    models.Program_List.findAll({
        where:{
            course_name : req.query.course
        }
    }).then(courses=>{
        if(courses){
            var duration = courses[0].duration
            var patternArr = [];
            if(req.query.pattern == 'Annual'){
                for(var i=1; i <=duration; i++){
                    var number = converter.toWordsOrdinal(i);
                    var number = number.charAt(0).toUpperCase() + number.slice(1).toLowerCase();
                    patternArr.push({
                        term_name : number + ' Year'
                    })
                }
            }else if(req.query.pattern == 'Semester'){
                duration = duration * 2;
                for(var i=1; i <=duration; i++){
                    var sem = romans.romanize(i)
                    patternArr.push({
                        term_name : 'Semester ' + sem
                    })
                }
            }
            res.json({
                status : 200,
                data : patternArr
            })
        }
    })
})
router.post('/updateAttestedFor',function(req,res) {
    var id = req.body.userid; 
    var appid = req.body.app_id; 
    var source = req.body.source; 
    var value = req.body.value;
    
    models.Applied_For_Details.update({
        attestedfor:value
    },{
        where:{
            app_id:req.body.app_id,
            source:req.body.source
        }
    }).then(async function(data){
        if(data ){
            var desc = "Document Type for " + appid + " is updated to " + value  + " by "+  req.user.email;
            var activity = "Attested For Update";
            functions.activitylog(req,id, activity, desc, appid, 'guAdmin');
            res.json({
                status: 200,
            })
        }else{
            res.json({
                status: 400
            })
        }
    })
    
})

router.post('/changeDeliveryMode',async function(req,res){
    var user_id = req.body.userid;
    var app_id = req.body.app_id;
    var value = req.body.value;
    var noofcopies = req.body.noofcopies;
    var address = req.body.address;
    var changedelivery;
    var change_purpose;
    
    if(value == 'digital'){
             changedelivery = await functions.changedelivery(app_id,'digital');
             change_purpose = await functions.change_purpose(app_id,'digital',null,null);
    }else{
             changedelivery = await functions.changedelivery(app_id,'sealed');
             change_purpose = await functions.change_purpose(app_id,'physcial',noofcopies,address);
    }
    
    if(changedelivery && change_purpose){
        var desc = "Delivery Mode  for " + app_id + " is updated to " + value  + " by "+  req.user.email;
            var activity = "Delivery Mode Update";
            functions.activitylog(req,user_id, activity, desc, app_id, 'guAdmin');
        res.json({
            status  : 200
        })
    }else{
        res.json({
            status  : 400
        })
    }
    
})
router.post('/sendmailtostudent', async function(req,res){
	var email = req.body.email;
		request.post(constant.BASE_URL_SENDGRID_Sppu + 'sendemail_syApplication', {
			json: {
					email  : email
			}
		}, function (error, response, body) {
			if(response){
				res.json({
					status : 200
				})
			}else{
				res.json({
					status : 400
				})
			}  
		})
});
/* Route : Upload Aadhar Image/pdf  for pickup details  
Paramater : application id,user Id and file name */
router.post('/upload_Aadhar',function(req,res){
	var userId = req.query.user_id;
	var image;
	var dir = FILE_LOCATION + "public/upload/documents/" + userId;
	var app_id = req.query.app_id;
	var ext;
    var source = req.query.source;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
  	var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, FILE_LOCATION+'public/upload/documents/'+userId);
		},
		filename: function(req, file, callback) {
			var extension = path.extname(file.originalname)
			var randomString = functions.generateRandomString(10,'alphabetic')
			var newFileName = randomString.concat(extension);
			image = newFileName;
			callback(null, newFileName);

		}
	});

	var upload = multer({
		storage: storage,
		fileFilter: function (req, file, callback) {
			ext = path.extname(file.originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.JPEG' && ext !== '.PDF') {
				return callback(res.end('Please upload your document in .pdf, .jpeg, .jpg or .png formats only'), null)
			}
			callback(null, true)
		}
	}).single('file');
	upload(req, res, function (err, data) {
		imageLocationToCallClient = image;
		if (ext == '.pdf') {
			fs.readFile(FILE_LOCATION +'public/upload/documents/' + userId + '/' + image, (err, pdfBuffer) => {
				new pdfreader.PdfReader().parseBuffer(pdfBuffer, function (err, item) {
					if (err) {
						uploadValue = false;
						ValueUpdateData(uploadValue);
					} else if (!item) {
						uploadValue = true;
						ValueUpdateData(uploadValue);
					} else if (item.text) {}
				});
			});
		} else {
			uploadValue = true;
			ValueUpdateData(uploadValue);
		}

		function ValueUpdateData(uploadValue) {
            models.Application.update({
                file_name: imageLocationToCallClient
            }, {
                where: {
                    id: app_id
                }
            }).then(function (data) {
                if (data > 0) {
                    var desc = "Adhar Document Updated by "+ req.user.email +" ( " +imageLocationToCallClient+ " ) ";
                    var activity = "Adhar Upload";
                    functions.activitylog(req,userId, activity, desc, app_id, 'guAdmin');
                        res.json({
                            status: 200,
                            message: `Upload Completed.`,
							data : imageLocationToCallClient

                        })
                } else {
                    res.json({
                        status: 400
                    })
                }
    
            })

		}
	});
});

/* Route : get application deatils to get pickup details  
Paramater : application id */
router.get('/getApplicationDetails',async function(req,res){
    var app_id = req.query.app_id;
    var Application = await functions.getApplication_Details(app_id)
if(Application.file_name){
        var imgArr = Application.file_name.split('.');
        var extension = imgArr[imgArr.length - 1].trim();
        res.json({
            data:Application,
            filePath : serverUrl+"/upload/documents/"+Application.user_id+"/"+Application.file_name,
            extension:extension,
            status:200
        })
}else{
    res.json({
        status:400
    })
}
})
/* Route : Give the access for particular email 
Paramater : set of roles and user_id */
router.post('/role_management/saverights',async function(req,res){
    var roles = req.body.roles;
    var dtChecked = req.body.dtChecked;
    var deChecked = req.body.deChecked;
    var reChecked =req.body.reChecked;
    var udChecked = req.body.udChecked;
    var drChecked = req.body.drChecked;
    var gmChecked = req.body.gmChecked;
    var pmChecked = req.body.pmChecked;
    var rmChecked = req.body.rmChecked;
    var dxChecked = req.body.dxChecked;
    var roles ='';
    if(dtChecked){
        roles += 'document_type,'
    }
    if(deChecked){
        roles +='delivery_type,'
    }
    if(reChecked){
        roles += 'receipt,'
    }
    if(udChecked){
        roles += 'upload_document,'
    }
    if(drChecked){
        roles +='document_reset,'
    }
    if(gmChecked){
        roles +='generateMissingDocs,'
    } 
    if(pmChecked){
        roles +='sendEmail,'
    }
    if(rmChecked){
        roles +='resendMail,'
    }      
    if(dxChecked){
        roles +='downloadExcel,'
    }      
    
    var user_role = await functions.updateadminrole(req.body.userId,roles)
    if(user_role){
        res.json({
            status:200
        })
    }else{
        res.json({
            status:400
        })
    }
});

/* Route : get the access for particular email 
Paramater : user_id */
router.get('/role_management/getRolesedulab',async function (req, res) {
    var user_id = req.query.userId;
    var dtChecked = false;
    var deChecked=false;
    var reChecked=false;
    var udChecked=false;
    var drChecked=false;
    var gmChecked=false;
    var pmChecked=false;
    var rmChecked=false;
    var dxChecked=false;
    var user_role = await functions.getuserdetail(user_id)
    if(user_role.edulab_rights != null){
        if(user_role.edulab_rights.includes('document_type')){
            dtChecked = true
        }
        if(user_role.edulab_rights.includes('delivery_type')){
            deChecked = true
        } 
        if(user_role.edulab_rights.includes('receipt')){
            reChecked = true
        } 
        if(user_role.edulab_rights.includes('upload_document')){
            udChecked = true
        }
        if(user_role.edulab_rights.includes('document_reset')){
            drChecked = true
        }
        if(user_role.edulab_rights.includes('generateMissingDocs')){
            gmChecked = true
        }
        if(user_role.edulab_rights.includes('resendMail')){
            rmChecked = true
        }
        if(user_role.edulab_rights.includes('sendEmail')){
            pmChecked = true
        }
        if(user_role.edulab_rights.includes('downloadExcel')){
            downloadExcel = true
        }
        res.json({
            data:user_role.edulab_rights,
            dtChecked,
            deChecked,
            reChecked,
            udChecked,
            drChecked,
            gmChecked,
            rmChecked,
            pmChecked,
            dxChecked,
            status:200
        })
    }else{
        res.json({
            status:400,
            dtChecked,
            deChecked,
            reChecked,
            udChecked,
            drChecked,
            gmChecked,
            rmChecked,
            pmChecked,
            dxChecked
        })
    }  
})
/* Route : get the dubai embassy Details with there particular id
Paramater : Id */
router.get('/getEmbassyDetails',(req,res)=>{
    var purpose = []
    var id = req.query.id;
    models.dubaiembassy.dubaiembassydata(id).then(function(dubaiembassydetails){
        dubaiembassydetails.forEach(dubaiembassydetails=>{
                purpose.push({
                    id:dubaiembassydetails.id,
                    app_id:dubaiembassydetails.app_id,
                    user_id:dubaiembassydetails.user_id,
                    courseName : dubaiembassydetails.courseName ? dubaiembassydetails.courseName :  'N.A',
                    passingyear : dubaiembassydetails.passingyear ? moment(new Date(dubaiembassydetails.passingyear)).format('YYYY-MM-DD')  :  'N.A',
                    name : dubaiembassydetails.name ? dubaiembassydetails.name :  'N.A',
                    convocationDate :dubaiembassydetails.convocationDate ? moment(new Date(dubaiembassydetails.convocationDate)).format('YYYY-MM-DD') :  'N.A',
                    result : dubaiembassydetails.result ? dubaiembassydetails.result :  'N.A',
                    courseType : dubaiembassydetails.courseType ? dubaiembassydetails.courseType :  'N.A',
                    seatno : dubaiembassydetails.seatNo ? dubaiembassydetails.seatNo :  'N.A',
                    purposeType: dubaiembassydetails.purposeType ? dubaiembassydetails.purposeType :  'N.A',
                    enrollmentYear :dubaiembassydetails.enrollmentYear ? moment(new Date(dubaiembassydetails.enrollmentYear)).format('YYYY-MM-DD') :  'N.A',
                    collegeName : dubaiembassydetails.collegeName ? dubaiembassydetails.collegeName :  'N.A'
                })        
        })
            if(purpose){
                res.json({
                    data :  purpose
                })
            }else{
                res.json({
                data  : null
                })
            }
        })
})

/* Route : To Edit the dubai embassy Details 
Paramater : Id,app_id,adminemail id and Value(all the details of particular ID of table) */
router.post('/savedubaiembassysdetails', async (req, res) => {
    var id = req.body.id
    var value = req.body.value
    var app_id = req.body.app_id
    var adminemail = req.body.adminemail

    var updateembassydetails = await functions.saveembassysdetails(id,value);
    if(updateembassydetails){
        var desc = "Dubai Embassy Details of " + app_id + " Edited " + " by "+  adminemail;
        var activity = "Dubai Embassy Details Update";
        functions.activitylog(req,req.body.userId, activity, desc, app_id, 'guAdmin');
        res.json({
            status:200
        })
    }else{
        res.json({
            status:400
        })
    }
})
router.get('/getUserInfo', async (req, res) => {
    const user_id = req.query.user_id;
    const source = req.query.source;
    const app_id=req.query.app_id;
    
  
    try {

      const verificationTypes = await models.VerificationTypes.findAll({ where: { user_id: user_id,app_id:app_id, source_from: source } });
      const documentDetails = await models.DocumentDetails.findAll({ where: { user_id: user_id,app_id:app_id} });
       
      if (!verificationTypes || !documentDetails) {
        return res.json({
          status: 404,
          message: "Data not found",
        });
      }else{
        res.json({
            status: 200,
            data: verificationTypes,
            details: documentDetails,
          });
      }
    
  
  
    } catch (err) {
      res.json({
        status: 500,
        message: "Internal Server Error",
      });
    }
  });

  
  router.post('/generatemissingdoc',async(req,res)=>{
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const app_id=req.body.app_id;
    const user_id=req.body.user_id;
    const source=req.body.source;
    const doc_id=req.body.doc_id;
    if(source == 'guverification'){
        try{
            await request.post(VERIFY_BASE_URL+'/application/generatemissingdoc',{json:{"app_id":app_id,"userId":user_id,"email_admin":req.user.email,"doc_id":doc_id,"clientIP":clientIP,"source":source}},
            await function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    var data = req.user.email+" has been generated missng document of "+app_id;
                    var activity = "Generate Missing Document";
                    functions.activitylog(req,user_id,activity,data,app_id,'guverification')
                    res.json({
                        status:200,
                        message:'Successfully attached missing documents'
                    })
                }else{
                    res.json({
                        status : 400,
                        message: VERIFY.message
                    })
                }
            }
        })

        }catch(e){
            res.json({
                status:500,
                message:"Internal server error"
            })
        }
    }

  });

  /** orderLookUp POST route to call all get request of gu portal single order lookUp
   * @param {Number} - orderId 
   * @param {Number} - refNum
   * @param {STRING} - service
  */
  router.post('/orderLookUp', async(req, res) => { 
    try{  
        const orderId = req.body.orderId;
        const refNum = req.body.refNum;
        const service = req.body.service; 

        if(service == "guattestation"){  
            request.get(ATTESTATION_BASE_URL+`/payment/orderlookup_single?order_id=${orderId}`,
            function(error, response, VERIFY){
                if(error){
                }else{ 
                    var data = JSON.parse(VERIFY)
                    if(data.status == 200){
                        return res.json({
                            status:200,
                            message:'Order LookUp Done Successfully!'
                        })
                    }else{
                        return res.json({
                            status:400,
                            message:'Order LookUp Data Not Found!'
                        }) 
                    }
                }
            })
        }else if(service == "gumoi"){   
            request.get(MOI_BASE_URL+`/payment/orderlookup_single?order_id=${orderId}`,
            function(error, response, VERIFY){
                if(error){
                }else{ 
                    var data = JSON.parse(VERIFY)
                    if(data.status == 200){
                        return res.json({
                            status:200,
                            message:'Order LookUp Done Successfully!'
                        })
                    }else{
                        return res.json({
                            status:400,
                            message:'Order LookUp Data Not Found!'
                        }) 
                    }
                }
            })
        }else if(service == "gumigration"){   
            request.get(MIGRATION_BASE_URL+`/payment/orderlookup_single?orderId=${orderId}&trackingId=${refNum}`,
            function(error, response, VERIFY){
                if(error){
                }else{
                    var data = JSON.parse(VERIFY)
                    if(data.status == 200){
                        return res.json({
                            status:200,
                            message:'Order LookUp Done Successfully!'
                        })
                    }else{
                        return res.json({
                            status:400,
                            message:'Order LookUp Data Not Found!'
                        }) 
                    }
                }
            })
        }else if(service == "guverification"){   
            request.get(VERIFY_BASE_URL+`/payment/orderlookup_single?order_id=${orderId}`,
            function(error, response, VERIFY){
                if(error){
                }else{
                    var data = JSON.parse(VERIFY)
                    if(data.status == 200){
                        return res.json({
                            status:200,
                            message:'Order LookUp Done Successfully!'
                        })
                    }else{
                        return res.json({
                            status:400,
                            message:'Order LookUp Data Not Found!'
                        }) 
                    }
                }
            })
        }else if(service == "gupdc"){    
            request.get(PDC_BASE_URL+`/payment/orderlookup_single?order_id=${orderId}`,
            function(error, response, VERIFY){
                if(error){
                }else{ 
                    var data = JSON.parse(VERIFY)
                    if(data.status == 200){
                        return res.json({
                            status:200,
                            message:'Order LookUp Done Successfully!'
                        })
                    }else{
                        return res.json({
                            status:400,
                            message:'Order LookUp Data Not Found!'
                        }) 
                    }
                }
            })
        }else if(service == "guinternship"){   
            request.get(intership_BASE_URL+`/payment/orderlookup_single?order_id=${orderId}`,
            function(error, response, VERIFY){
                if(error){
                }else{ 
                    var data = JSON.parse(VERIFY)
                    if(data.status == 200){
                        return res.json({
                            status:200,
                            message:'Order LookUp Done Successfully!'
                        })
                    }else{
                        return res.json({
                            status:400,
                            message:'Order LookUp Data Not Found!'
                        }) 
                    }
                }
            })
        }else if(service == "gusyverification"){   
            request.get(SY_VERIFY_BASE_URL+`/payment/orderlookup_single?order_id=${orderId}`,
            function(error, response, VERIFY){
                if(error){
                }else{
                    if(data.status == 200){
                        return res.json({
                            status:200,
                            message:'Order LookUp Done Successfully!'
                        })
                    }else{
                        return res.json({
                            status:400,
                            message:'Order LookUp Data Not Found!'
                        }) 
                    }
                }
            })
        }else if(service == "gupec"){   
            request.get(MIGRATION_BASE_URL+`/payment/orderlookup_single?orderId=${orderId}&trackingId=${refNum}`,
            function(error, response, VERIFY){
                if(error){
                }else{
                    var data = JSON.parse(VERIFY)
                    if(data.status == 200){
                        return res.json({
                            status:200,
                            message:'Order LookUp Done Successfully!'
                        })
                    }else{
                        return res.json({
                            status:400,
                            message:'Order LookUp Data Not Found!'
                        }) 
                    }
                }
            })
        }
    }catch(error){
        console.error("Error in /orderLookUp", error);
        return res.json({
            status: 500,
            message: "Internal Server Error"
        });
    }
})

  /*  Author : Priyanka Divekar
Route : Get course details for uploading supporting documents for transcript/degree certificate of given application id
Paramater :user id, app_id*/

router.get('/getCourseForSupportingDocuments', async (req, res) => {
    var user_id = req.query.user_id;
    var app_id = req.query.app_id;

    models.DocumentDetails.getDistinctCourse(app_id,user_id).then(function(courses){
        var selectedCourse = [];
        require('async').eachSeries(courses,function(course,callback){
            let patternArr = [];
            var duration = course.duration;
            for(var i=1; i <=duration; i++){
                var number = converter.toWordsOrdinal(i);
                var number = number.charAt(0).toUpperCase() + number.slice(1).toLowerCase();
                patternArr.push({
                    term_name : number + ' Year'
                })                
            }
            duration = course.duration * 2;
            for(var i=1; i <=duration; i++){
                var sem = romans.romanize(i)
                    patternArr.push({
                        term_name : 'Semester ' + sem
                    })                
            }
            selectedCourse.push({
                courseName : course.courseName,
                duration : course.duration,
                year_sem : patternArr
            })
            callback()
        },function(err,result){
            res.json({
                status : 200,
                data : selectedCourse
            })
        }) 
    })

});


 /*  Author : Shubham Ravrane
  Route : generate Missing Documents if any documnets are not view in preview 
Paramater :user id, app_id, source*/
router.post('/generateMissingDocs',async(req,res)=>{
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const app_id=req.body.appId;
    const user_id=req.body.userId;
    const source=req.body.source;
    if(source == 'guattestation'){
        try{
            request.post(ATTESTATION_BASE_URL+'/signpdf/generateMissingDocs',{json:{"appId":req.body.appId,"userId":req.body.userId,"type":req.body.source}},
            await function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    var data = req.user.email+" has been generated missng document of "+app_id;
                    var activity = "Generate Missing Document";
                    functions.activitylogOthers(req,user_id,activity,data,app_id,'guattestation',true)
                    res.json({
                        status:200,
                        message:VERIFY.message
                    })
                }else{
                    res.json({
                        status : 400,
                        message: VERIFY.message
                    })
                }
            }
        })

        }catch(e){
            res.json({
                status:500,
                message:"Internal server error"
            })
        }

       
    }

});

/*  Author : Shubham Ravrane
  Route : Re-Missing Documents if any documnets are not view in preview 
Paramater :type, app_id, source*/
router.post('/resendEmail', function (req, res) {
    var app_id = req.body.id;
    var type = req.body.type;
    var source_from = req.body.source_from
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if(source_from == 'guattestation' ){
        request.post(ATTESTATION_BASE_URL+'/signpdf/documentSendingRegenerate',{json:{"appl_id":app_id,"email_admin":req.user.email,"value" :type,"clientIP":clientIP}},
        function(error, response, VERIFY){
            if(error){
            }else{
                if(VERIFY.status == 200){
                    var data = req.user.email+" has been Resend missng document of "+app_id;
                    var activity = "Resend missng document";
                    functions.activitylogOthers(req,'',activity,data,app_id,'guattestation',true)
                    res.json({
                        status:200,
                        message:'Application Sent Successfullly..'
                    })
                }else{
                    res.json({
                        status:400,
                        message: VERIFY['message']
                    })
                }
            }
        })
    }

})
module.exports = router;