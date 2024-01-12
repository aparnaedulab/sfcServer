var moment = require('moment');
var Moment = require('moment-timezone');
var Sequelize = require("sequelize");
const Op = Sequelize.Op;
var models  = require('../models');
var crypto = require('crypto');
var randomstring = require('randomstring');
const axios = require('axios');

module.exports = {

	

	getInstructional: async (app_id) => {
		return await models.InstructionalDetails.findAll({ where: {app_id: app_id}});
	},
	getDocumentDetailsData: async (app_id) => {
		return await models.DocumentDetails.findAll({ where: {app_id: app_id}});
	},
	getAttestedforOutward: async (app_id) => {
		return await models.Applied_For_Details.findOne({ where: { app_id  : app_id} });
	},
	getuserdetail: async (user_id) => {
		return await models.User.findOne({ where: { id: user_id  } });
	},
	getTranscriptProvisional : async (app_id)=>{
		return await models.User_Transcript.findOne({ where: { app_id : app_id , provisional : false , type : {
			[Op.like] : '%degree%'
		}, } });
	},
	updateTracker: async(app_id)=>{
		return await	models.Application.update({
				tracker  : 'verified',
				status : 'accept'
			},{
				where:{
					id  : app_id
				}
			})
		},
	verifyforprint: async(app_id)=>{
		return await	models.Application.update({
			verifyprint : true
			},{
				where:{
					id  : app_id
				}
			})
		},
	changedelivery: async(app_id,value)=>{
		return await	models.Application.update({
			deliveryType : value
			},{
				where:{
					id  : app_id
				}
			})
		},
	change_purpose: async(app_id,value,noofcopies,address)=>{
		if(value == 'physcial'){
			return await	models.Institution_details.update({
				deliveryType : value,
				noofcopies : noofcopies,
				address: address,
				inst
				},{
					where:{
						app_id  : app_id
					}
				})
		}else{
			return await	models.Institution_details.update({
				deliveryType : value
				},{
					where:{
						app_id  : app_id
					}
				})
		}
		},
	updateVerify: async(app_id,user_id,type,source)=>{
		var Forward;
		if(source == 'guattestation' ){
			if(type == 'marksheets' || type == 'marksheet'){
			var Forward =  models.UserMarklist_Upload.update({verify_doc  : true},{where:{app_id  : app_id , user_id :  user_id}})
			}	
			if(type == 'transcript' ||  type == 'degree' || type == 'thesis'){
				var Forward = models.User_Transcript.update({verify_doc  : true},{where:{app_id  : app_id , user_id :  user_id}})
			}
			if(type == 'instructional'){
				var Forward = models.InstructionalDetails.update({verify_doc  : true},{where:{app_id  : app_id , userId :  user_id}})
			}
			if(type == 'guverification' || type == 'gusyverification'){
				var Forward = models.DocumentDetails.update({verify_doc  : true},{where:{app_id  : app_id , user_id :  user_id}})
			}
			return Forward
		}
		if(source == 'gumoi' ){
			if(type == 'marksheets' || type == 'marksheet'){
			var Forward =  models.UserMarklist_Upload.update({verify_doc  : true},{where:{app_id  : app_id , user_id :  user_id}})
			}
			if(type == 'instructional'){
				var Forward = models.InstructionalDetails.update({verify_doc  : true},{where:{app_id  : app_id , userId :  user_id}})
			}
			
			return Forward
		}
		if(source == 'guverification'){
			if(type == 'degree'){
				return await models.DocumentDetails.update({
					verify_doc  : true
				},{
					where:{
						app_id:app_id,
						user_id:user_id,
						type:type,
						degree_Type: 'Degree Certificate'
					}
				});
			}else{
				return await models.DocumentDetails.update({
					verify_doc  : true
				},{
					where:{
						app_id:app_id,
						user_id:user_id,
						type:type
					}
				});
			}
		}
		if(source == 'gusyverification'){
			return await models.DocumentDetails.update({verify_doc  : true},{where:{app_id  : app_id , user_id :  user_id}})
		}
	},


	UpdateToPrint: async (app_id) => {
		return await models.Application.update({
				tracker :  'printedulab'
		},{
			where:{
				id : app_id
			}
		});
	},
	getAttestedFor: async (user_id) => {
		return await models.Applied_For_Details.findAll({ where: { user_id: user_id} });
	},

	getedudetailpdc: async(user_id,source,category)=>{
		// return await models..findAll({ where: { id: user_id,  } });
		if(category == 'studentManagement'){
			return await models.edu_details.findAll({ where: { user_id: user_id,source:source } });
		}else{
			return await models.edu_details.findAll({ where: { user_id: user_id, app_id : {
				[Op.ne] : null
			},source:source } });
		}


	},
	getdocdetailpdc: async(user_id,source,category)=>{
		if(category == 'studentManagement'){
			return await models.Applicant_Marksheet.findAll({ where: { user_id: user_id,source:source } });
		}else{
			return await models.Applicant_Marksheet.findAll({ where: { user_id: user_id, app_id : {
				[Op.ne] : null
			},source:source } });
		}
	},
	getdocdetailmig: async(user_id,source)=>{
		return await models.Applicant_Marksheet.findAll({ where: { user_id: user_id,source:source } });
	},
	getapplication: async(userId,status,tracker, source)=>{
		if(status == '' && tracker == ''){
			return await models.Application.findAll({ where: { user_id: userId,source_from:source} });
		}else{
			return await models.Application.findAll({ where: { user_id: userId,source_from:source,status:status,tracker:tracker } });
		}
	},
	userMarkList: async(userId)=>{


		return await models.userMarkList.findAll({ where: { user_id: userId } });
	},


	getapplicationmig: async(userId, source)=>{

		return await models.Application.findAll({ where: { user_id: userId,source_from:source } });
	},
	getverification: async(user_id,category)=>{
		if(category == 'studentManagement'){
			return await models.DocumentDetails.findAll({ where: { user_id: user_id} });
		}else{
			return await models.DocumentDetails.findAll({ where: { user_id: user_id, app_id : {
				[Op.ne] : null
			}} });
		}
	},
	usermarlistdata: async(user_id,app_id)=>{
		return await models.userMarkList.findAll({ where: { user_id: user_id, app_id :app_id } });
	},
	userTranscriptdata :async (user_id)=>{
		return await models.User_Transcript.findAll({ where: { user_id: user_id } });

	},
	usermarlistupload: async(user_id,app_id)=>{
		return await models.UserMarklist_Upload.findAll({ where: { user_id: user_id, app_id :app_id } });
	},
	getedumigration: async(user_id)=>{
		return await models.Applicant_Educational_Details.findAll({ where: { user_id: user_id } ,raw:true});
	},
	getapplicationprint :async(userid)=>{
		return await models.Application.findAll({ where: { user_id: userid,
			tracker: {
				[Op.ne]: 'apply'
			}, } ,raw:true});

	},
	updateoutwardnumber: async(user_id,app_id,outward)=>{
		return await	models.User_Course_Enrollment_Detail_PDC.update({
				outward:outward
	
			},{
				where:{
					user_id:user_id,
					application_id:app_id
				}
			})
		},
		// for merge documents
		merge: async function (mergefilesString, outputString) {
			var day = moment();
			day=day.format('DD-MM-YYYY');
			var day_path = constant.FILE_LOCATION+"public/upload/merge_files/"+source+"/"+day;
			if(!fs.existsSync(day_path)){
			  fs.mkdirSync(day_path);
			}
			var app_init = app_array[0];
			var app_last = app_array[app_array.length-1];
			var outputfile = "'"+constant.FILE_LOCATION+"public/upload/merge_files/"+source+"/"+day+"/"+app_init+"-"+app_last+".pdf"+"'";
			var command = "pdfunite " + mergefilesString + " " + outputString; 
		  const pdfunite = exec(command, function (error, stdout, stderr) {
			  if (error) {
				  logger.error(error.stack);
				  logger.error('Error code: ' + error.code);
				  logger.error('Signal received: ' + error.signal);
			  } else {
				  logger.info("file created @ " + outputfile);
			  }
			  logger.debug('Child Process STDOUT: ' + stdout);
			  logger.error('Child Process STDERR: ' + stderr);
		  });
  
		  pdfunite.on('exit', function (code) {
			  logger.debug('Child process exited with exit code ' + code);
		  });
	  },

	  updateDocuments : async(doc_id,type,source,checked)=>{
		if(source == 'guattestation' ){
			if(type =='marksheets' || type =='marksheet'){
				if(checked == true){
					return await models.UserMarklist_Upload.update({
						verify_doc : true
						},{
							where:{
								id : doc_id
							}
						})
				}else{
					return await models.UserMarklist_Upload.update({
						verify_doc : false
						},{
							where:{
								id : doc_id
							}
						})
				}
				
			}
			if(type =='transcript'){
				if(checked == true){
					return await models.User_Transcript.update({
						verify_doc : true
						},{
							where:{
								id : doc_id,
								type : {
									[Op.like] : '%transcript%'
								},
							}
						})
				}else{
					return await models.User_Transcript.update({
						verify_doc : false
						},{
							where:{
								id : doc_id,
								type : {
									[Op.like] : '%transcript%'
								},
							}
						})
				}
				
			}
			if(type =='degree'){
				if(checked == true){
					return await models.User_Transcript.update({
						verify_doc : true
						},{
							where:{
								id : doc_id,
								type : {
									[Op.like] : '%degree%'
								},
							}
						})
				}else{
					return await models.User_Transcript.update({
						verify_doc : false
						},{
							where:{
								id : doc_id,
								type : {
									[Op.like] : '%degree%'
								},
							}
						})
				}
				
			}
			if(type =='instructional'){
				if(checked == true){
					return await models.InstructionalDetails.update({
						verify_doc : true
						},{
							where:{
								id : doc_id
							}
						})
				}else{
					return await models.InstructionalDetails.update({
						verify_doc : false
						},{
							where:{
								id : doc_id
							}
						})
				}
				
			}
		}
		if(source == 'gumoi' ){
			if(type =='marksheets' || type =='marksheet'){
				if(checked == true){
					return await models.UserMarklist_Upload.update({
						verify_doc : true
						},{
							where:{
								id : doc_id
							}
						})
				}else{
					return await models.UserMarklist_Upload.update({
						verify_doc : false
						},{
							where:{
								id : doc_id
							}
						})
				}
			
			}
			if(type =='instructional'){
				if(checked == true){
					return await models.InstructionalDetails.update({
						verify_doc : true
						},{
							where:{
								id : doc_id
							}
						})
				}else{
					return await models.InstructionalDetails.update({
						verify_doc : false
						},{
							where:{
								id : doc_id
							}
						})
				}
				
			}
		}
		if(source == 'guverification' || source == 'gusyverification'){
			if(checked == true){
				return await models.DocumentDetails.update({
					verify_doc : true
					},{
						where:{
							id : doc_id
						}
					})
			}else{
				return await models.DocumentDetails.update({
					verify_doc : false
					},{
						where:{
							id : doc_id
						}
					})
			}
				
			
			
		}
	},
	generateRandomString: function(length, charset) {
		return randomstring.generate({
			length: length,
			charset: charset
		});
	},
	getAttestationFor :async(user_id,source)=>{
		return await models.Applied_For_Details.findOne({where :{user_id :  user_id, app_id : {
			[Op.eq] : null
		},source : source}});
	
	},
	
	saveOutwardNumber: async(app_id,user_id,outward,type,source,degree,letterFormat,count,email,clientIP , )=>{

		if(source.includes('guattestation')){
			if(outward == 'undefined' || outward== undefined){
				return false;
			}else{
				if(count >= 1){
					var data =  await models.User_Course_Enrollment_Detail_Attestation.update({outward:outward ,type : type ,application_id:app_id ,user_id:user_id,degree_type : degree},{
						where:{
							application_id:app_id,
							user_id:user_id,
							type:type
						}
						
					})
					if(data){
						var data = "For Application " + app_id + " Update Outward "+"( "+ outward +" )"+" Number for "+ type + " by "+  email;
						var activity = "Update Outward Number ";
						// const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
						await models.Activitytracker.create({ user_id: user_id,activity: activity ,data: data ,application_id: app_id ,created_at: moment(), source  : source,  ipAddress:clientIP});
						return data;
					}
				}else{

					var data = await models.User_Course_Enrollment_Detail_Attestation.create({outward:outward ,type : type ,application_id:app_id ,user_id:user_id,degree_type : degree});
					if(data){
						var data = "For Application " + app_id + " Create Outward "+"( "+ outward +" )"+" Number for "+ type + " by "+  email;
						var activity = "Create Outward Number ";
						// const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
						await models.Activitytracker.create({ user_id: user_id,activity: activity ,data: data ,application_id: app_id ,created_at: moment(), source  : source,  ipAddress:clientIP});
						return data;
					}																																									
				}
			}
		}
		if(source.includes('gumoi')){
			if(outward == 'undefined' || outward== undefined){
				return false;
			}else{
				var data =  await models.User_Course_Enrollment_Detail_Attestation.create({outward:outward ,type : type ,application_id:app_id ,user_id:user_id,degree_type : degree});
			if(data){
				var data = "For Application " + app_id + " Create Outward "+"( "+ outward +" )"+" Number for "+ degree + " by "+  email;
				var activity = "Create Outward Number ";
				// const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
				await models.Activitytracker.create({ user_id: user_id,activity: activity ,data: data ,application_id: app_id ,created_at: moment(), source  : source,  ipAddress:clientIP});
				return data;
			}
		}
		}
		if (source.includes('guverification')) {
			var updated = false;
			await models.MDT_User_Enrollment_Detail.findOne({
				where: {
					application_id: app_id,
					user_id: user_id,
					MDT_type: type
				}
			}).then(async (mdtEnroll) => {
				if (mdtEnroll) {
					await mdtEnroll.update({
						outward: outward,
						inward: letterFormat
					}).then((updates_details) => {
						if (updates_details)
							updated = true;
						let act = 'Update Outward Number';
						let data = `For Application ${app_id} Update Outward (${outward}) Number for ${type} by ${email}`
						models.Activitytracker.create({ user_id: user_id, activity: act, data: data, application_id: app_id, created_at: moment(), source: source, ipAddress: clientIP });

					})

				} else {
					await models.MDT_User_Enrollment_Detail.findOne({
						where: {
							user_id: user_id,
							application_id: app_id
						}
					}).then(async (mdtDetails) => {
						if (mdtDetails) {
							await models.MDT_User_Enrollment_Detail.create({
								enrollment_no: mdtDetails.enrollment_no,
								application_date: mdtDetails.application_date,
								user_id: user_id,
								application_id: app_id,
								randomNumber: mdtDetails.randomNumber,
								MDT_type: type,
								outward: outward,
								inward: letterFormat
							}).then((updates_details) => {
								if (updates_details)
									updated = true;

								let act = 'Create Outward Number';
								let data = `For Application ${app_id} Create Outward (${outward}) Number for ${type} by ${email}`
								models.Activitytracker.create({ user_id: user_id, activity: act, data: data, application_id: app_id, created_at: moment(), source: source, ipAddress: clientIP });
							})
						} else {
							await models.MDT_User_Enrollment_Detail.getApplicationData(app_id).then(async (app_data) => {
								await models.MDT_User_Enrollment_Detail.create({
									enrollment_no: parseInt(app_data[0].max_enroll) + 1,
									application_date: app_data[0].app_date,
									user_id: user_id,
									application_id: app_id,
									randomNumber: 100000 + parseInt(app_id),
									MDT_type: type,
									outward: outward,
									inward: letterFormat
								}).then((updates_details) => {
									if (updates_details)
										updated = true;

									let act = 'Create Outward Number';
									let data = `For Application ${app_id} Create Outward (${outward}) Number for ${type} by ${email}`
									models.Activitytracker.create({ user_id: user_id, activity: act, data: data, application_id: app_id, created_at: moment(), source: source, ipAddress: clientIP }); 

								})
							})
						}
					})

				}

			})
			return updated;

		}
		if (source.includes('gusyverification')) {

			var updated = false;
			await models.SY_User_Enrollment_Detail.findOne({
				where: {
					application_id: app_id,
					user_id: user_id,
				}
			}).then(async (syEnroll) => {
				if (syEnroll) {
					await syEnroll.update({
						outward: outward
					}).then((updatedSy) => {
						if(updatedSy){
						updated = true;
						let act = 'Update Outward Number';
						let data = `For Application ${app_id} Update Outward (${outward}) Number for ${type} by ${email}`
						models.Activitytracker.create({ user_id: user_id, activity: act, data: data, application_id: app_id, created_at: moment(), source: source, ipAddress: clientIP });
						}
					})
				} else {
					await models.SY_User_Enrollment_Detail.getApplicationData(app_id).then(async (app_data) => {
						await models.SY_User_Enrollment_Detail.create({
							enrollment_no: parseInt(app_data[0].max_enroll) + 1,
							application_date: app_data[0].app_date,
							user_id: user_id,
							application_id: app_id,
							randomNumber: 100000 + parseInt(app_id),
							outward: outward
						}).then((createdSY) => {
							if (createdSY) {
								updated = true;
								let act = 'Create Outward Number';
								let data = `For Application ${app_id} Create Outward (${outward}) Number for ${type} by ${email}`
								models.Activitytracker.create({ user_id: user_id, activity: act, data: data, application_id: app_id, created_at: moment(), source: source, ipAddress: clientIP });
							}
						})
					})
				}
				
			})
			return updated;
		}
		if(source.includes('pdc') || source.includes('guconvocation') || source.includes('gumigration') || source.includes('guinternship')){
			
			var data =  await models.User_Course_Enrollment_Detail_Attestation.create({outward: null  ,type : type ,application_id:app_id ,user_id:user_id , source  : source  });
			console.log('datadata' , data)
			if(data){
				var data = "For Application " + app_id + " Create Outward "+"( "+ outward +" ) by " +  email;
				var activity = "Create Outward Number ";
				await models.Activitytracker.create({ user_id: user_id,activity: activity ,data: data ,application_id: app_id ,created_at: moment(), source  : source,  ipAddress:clientIP});
				return data;
			}
		}

	},
	updateoutward : async(app_id,user_id,outward,type,source,degree,letterFormat)=>{
		if(type == 'instructional'){
					return await models.User_Course_Enrollment_Detail_Attestation.update({outward:outward ,type : type ,application_id:app_id ,user_id:user_id,degree_type : degree},{
						where:{
							application_id:app_id,
							user_id:user_id,
							type:type,
							degree_type:degree
			
						}
					});
				}else{
					return await models.User_Course_Enrollment_Detail_Attestation.update({outward:outward ,type : type ,application_id:app_id ,user_id:user_id,degree_type : degree},{
						where:{
							application_id:app_id,
							user_id:user_id,
							type:type,	
						}
					});
				}
				
			},

			updatesyoutward : async(app_id,user_id,outward)=>{
				return await models.SY_User_Enrollment_Detail.update({outward:outward},{
					where:{
						application_id: app_id,
						user_id: user_id
					}
				})
			},
	updateverifyoutward : async(app_id,user_id,outward,type)=>{
		return await models.MDT_User_Enrollment_Detail.update({outward:outward},{
			where:{
				application_id: app_id,
				user_id: user_id,
				MDT_type: type
			}
		})
	},
	allMarksheet: async(user_id , app_id, type,source)=>{
		if(source == 'guattestation' ){
		if(type == 'marksheets' || type =='marksheet'){
			return await models.UserMarklist_Upload.findOne({ where: { user_id: user_id , app_id: app_id ,user_marklist_id :{[Op.ne] : null},[Op.or]:[{verify_doc:0},{verify_doc:null},{verify_doc:false}]} ,raw:true});
		}
		if(type == 'transcript'){
			return await models.User_Transcript.findOne({ where: { user_id: user_id , app_id: app_id ,  type : {
				[Op.like] : '%transcript%'
			},[Op.or]:[{verify_doc:0},{verify_doc:null},{verify_doc:false}] } ,raw:true});
		}
		if(type == 'degree'){
			return await models.User_Transcript.findOne({ where: { user_id: user_id , app_id: app_id , type : {
				[Op.like] : '%degree%'
			}  , provisional : false,  [Op.or]:[{verify_doc:0},{verify_doc:null},{verify_doc:false}]} ,raw:true});
		}
		if(type == 'instructional'){
			return await models.InstructionalDetails.findOne({ where: { userId: user_id , app_id: app_id ,[Op.or]:[{verify_doc:0},{verify_doc:null},{verify_doc:false}]}});
		}
	}
	if(source == 'gumoi' ){
		if(type == 'marksheets' || type =='marksheet'){
			return await models.UserMarklist_Upload.findOne({ where: { user_id: user_id , app_id: app_id ,[Op.or]:[{verify_doc:0},{verify_doc:null},{verify_doc:false}]} ,raw:true});
		}
		if(type == 'instructional'){
			return await models.InstructionalDetails.findOne({ where: { userId: user_id , app_id: app_id,[Op.or]:[{verify_doc:0},{verify_doc:null},{verify_doc:false}]}});
		}
	}
	if(source == 'guverification' || source == 'gusyverification'){
		if(type == 'marksheet'){
			return await models.DocumentDetails.findAll({ where: { user_id: user_id , app_id: app_id ,type : 'marksheet'} ,raw:true});
		}
		if(type == 'transcript'){
			return await models.DocumentDetails.findAll({ where: { user_id: user_id , app_id: app_id ,  type : 'transcript' } ,raw:true});
		}
		if(type == 'degree'){
			return await models.DocumentDetails.findAll({ where: { user_id: user_id , app_id: app_id ,type : 'degree', degree_Type:'Degree Certificate'} ,raw:true});
		}
		if(type == 'secondYear'){
			return await models.DocumentDetails.findAll({ where: { user_id: user_id , app_id: app_id ,type : 'secondYear'} ,raw:true});
		}
	}
	},
	checkVerified: async(app_id,user_id,type,source)=>{
		markshtrue = false;
		insttrue = false;
		transtrue = false;
		degreetrue = false;
		thesistrue = false;
		forwardData = false;
		var applied;
		if(source == 'guattestation'){
			applied = await models.Applied_For_Details.findOne({ where : {user_id: user_id , app_id : app_id}});
			if(applied.educationalDetails == true){
				if(applied.attestedfor.includes('marksheet')){
					marks =  await models.UserMarklist_Upload.findAll({ where: { user_id: user_id , app_id: app_id } ,raw:true});
					require('async').eachSeries(marks, function(student, callback){
						if(student.verify_doc == 1){
							markshtrue = true
						}else{
							markshtrue = false
						}
					callback();
				}, async function(){

				});
				}else{
					markshtrue = true;
				}
				if(applied.attestedfor.includes('transcript')){
					trans = await  models.User_Transcript.findAll({ where: { user_id: user_id , app_id: app_id ,  type : {
						[Op.like] : '%transcript%'
					}, } ,raw:true});
					require('async').eachSeries(trans, function(student, callback){
						if(student.verify_doc == 1){
							transtrue = true
						}else{
							transtrue = false
						}
					callback();
				}, async function(){           
					
				});
				}else{
					transtrue = true
				}
				if(applied.attestedfor.includes('degree')){
					degree = await  models.User_Transcript.findAll({ where: { user_id: user_id , app_id: app_id , type : {
						[Op.like] : '%degree%'
					},provisional : false } ,raw:true});
					if(degree.length > 0){
						require('async').eachSeries(degree, function(student, callback){
							if(student.verify_doc == 1){
								degreetrue = true
							}else{
								degreetrue = false
							}
						callback();
					}, async function(){           
						
					});
					}else{
						degreetrue = true
					}
				}else{
					degreetrue = true
				}
				if(applied.attestedfor.includes('thesis')){
					thesis =  await  models.User_Transcript.findAll({ where: { user_id: user_id , app_id: app_id , type : {
						[Op.like] : '%thesis%'
					},} ,raw:true});
					require('async').eachSeries(thesis, function(student, callback){
						if(student.verify_doc == 1){
							thesistrue = true
						}else{
							thesistrue = false
						}
					callback();
				}, async function(){           
					
				});
				}else{
					thesistrue = true
				}

				if(markshtrue == true && transtrue == true && degreetrue == true && thesistrue == true ){
					forwardData = true
				}
				return forwardData;
			}else{
				instruc =  await models.InstructionalDetails.findAll({ where: { userId: user_id , app_id: app_id } ,raw:true});
				require('async').eachSeries(instruc, function(student, callback){
					if(student.verify_doc == 1){
						insttrue = true
					}else{
						insttrue = false
					}
				callback();
			}, async function(){

			});
			
			if( insttrue == true ){
				forwardData = true
			}
			return forwardData;
			}
		}else if( source == 'gumoi' ){
			applied = await models.Applied_For_Details.findOne({ where : {user_id: user_id , app_id : app_id}});
				instruc =  await models.InstructionalDetails.findAll({ where: { userId: user_id , app_id: app_id } ,raw:true});
				require('async').eachSeries(instruc, function(student, callback){
					if(student.verify_doc == 1){
						insttrue = true
					}else{
						insttrue = false
					}
				callback();
			}, async function(){

			});
			
			if( insttrue == true ){
				forwardData = true
			}
			return forwardData;
		}else if(source == 'guverification' || source =='gusyverification'){
			var verified1;
			var verified2;
			verified1 = await models.DocumentDetails.findAll({where:{user_id : user_id,app_id : app_id,
				type:{[Op.notIn]:['supportive']}, 
				degree_Type:{[Op.notIn]:['Provisional Degree Certificate', 'Internship Completion Certificate']}},
				raw:true});
			verified2 = await models.DocumentDetails.findAll({where:{user_id : user_id,app_id : app_id,
			type:{[Op.notIn]:['supportive']}, 
			degree_Type:{[Op.notIn]:['Provisional Degree Certificate', 'Internship Completion Certificate']},
			verify_doc: true},raw:true});
			if(verified1.length == verified2.length){
				forwardData = true
			}
			return forwardData;
		}
	},
	checkType:async(app_id,user_id,type)=>{
		var forwardData =false;
		var verify;
		var verify2;
		if(type == 'degree'){
			verify=await models.DocumentDetails.findAll({where:{app_id:app_id,user_id:user_id,type:type, 
				degree_Type: 'Degree Certificate'},raw:true});
			verify2=await models.DocumentDetails.findAll({where:{app_id:app_id,user_id:user_id,type:type,
					verify_doc:true, degree_Type:'Degree Certificate'},raw:true});
		}else{
			verify=await models.DocumentDetails.findAll({where:{app_id:app_id,user_id:user_id,type:type, 
				},raw:true});
			verify2=await models.DocumentDetails.findAll({where:{app_id:app_id,user_id:user_id,type:type,
				verify_doc:true},raw:true});
		}
		if(verify.length==verify2.length){
			forwardData =true;	
		}
		return forwardData


	},
	saveInstructional: async(id,value,diff_college_one,diff_college_two,selected_pattern)=>{
		return await models.InstructionalDetails.update({
			studentName : value.studentname,
			collegeName :  value.college,
			courseName :  value.course,
			specialization :  value.specialization,
			yearofenrollment :  value.yearenrollment,
			duration : value.duration,
			yearofpassing :  value.yearpassing,
			division :  value.result,
			instruction_medium :  value.medium,
			instruction_medium_two :  value.secondMedium ? value.secondMedium : null,
			clg :  value.affiliated ? value.affiliated : null,
			courseshort :  value.shortname ? value.shortname : null,
			Course_part :  value.Course_part ? value.Course_part : null,
			internship : value.InternshipCtrl ,
			seat_no : value.seatnoCtrl,
			diff_col_one : diff_college_one,
			diff_col_two : diff_college_two,
			education: value.education,
			selected_pattern:selected_pattern,
			selected_exam:value.exam ?  value.exam : 0,
		},{
			where:{
				id : id
			}
		});

	},
	activitylog: async(req,user_id,activity,data,application_id,source)=>{
		const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		return await models.Activitytracker.create({ user_id: user_id,activity: activity ,data: data ,application_id: application_id ,created_at: moment(), source  : source,  ipAddress:clientIP});
	},
	activitylogOthers: async(req,user_id,activity,data,application_id,source,edulabActivity)=>{
		const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		return await models.Activitytracker.create({ user_id: user_id,activity: activity ,data: data ,application_id: application_id ,created_at: moment(), source  : source,  ipAddress:clientIP,edulabActivity:edulabActivity});
	},
	deleteDocument: async(id,type,source,user_id,req)=>{
		var deleted;
		var attestedForArr;
		models.Applied_For_Details.findOne({
			where :{
				user_id : user_id
			}
		}).then(async (applied_for)=>{
			if(source == 'guattestation' ){
				if(type == 'marksheet'){
					var deleted = await models.UserMarklist_Upload.destroy({
						where:{
							id : id
						}
					});

					models.UserMarklist_Upload.findAll({
						where:{
							user_id : user_id,
							app_id : app_id
						}
					}).then((marksheets)=>{
						if(marksheets.length == 0){
							
							attestedForArr = applied_for.attestedfor.split(',');
							var index = attestedForArr.indexOf('marksheet');
							attestedForArr.splice(index,1);
							var attested_for = attestedForArr.join(',');
							applied_for.update({
								attestedfor : attested_for
							}).then(async (applied)=>{
								var activity = "Document Deleted"
								var desc = "All documents deleted of marksheet types by " + req.user.email
								await module.exports.activitylog(req,user_id,activity,desc,app_id,'guAdmin') 
							})
						}
					})
				}
				if(type == 'transcript' || type == 'degree'){
					var deleted = await models.User_Transcript.destroy({
						where:{
							id : id
						}
					});

					models.User_Transcript.findAll({
						where:{
							type:{
								[Op.like]: '%' + type + '%'
							},
							user_id : user_id,
							app_id : app_id
						}
					}).then(async (marksheets)=>{
						if(marksheets.length == 0){
							attestedForArr = applied_for.attestedfor.split(',');
							var index = attestedForArr.indexOf(type);
							attestedForArr.splice(index,1);
							var attested_for = attestedForArr.join(',');
							await applied_for.update({
								attestedfor : attested_for
							}).then(async (applied)=>{
								var activity = "Document Deleted"
								var desc = "All documents deleted of " +  type +" type by " + req.user.email
								await module.exports.activitylog(req,user_id,activity,desc,app_id,'guAdmin') 
							})
						}
					})
				}
				if(type == 'bonafied'){
					var deleted = await models.Applicant_Marksheet.destroy({
						where:{
							id : id
						}
					});
				}
				return deleted
			}else if(source == 'gumoi'){
				if(type == 'marksheet'){
					var deleted = await models.UserMarklist_Upload.destroy({
						where:{
							id : id
						}
					});
				}
				if(type == 'bonafied'){
					var deleted = await models.Applicant_Marksheet.destroy({
						where:{
							id : id
						}
					});
				}
				if(type=='instructional'){
							models.InstructionalDetails.destroy({
								where:{
									id : id
								}
							});
						}
				return deleted
			}else{
			}
		})
	},
	generateHashPassword :function(password) {
		var hashPassword = crypto
			.createHash("md5")
			.update(password)
			.digest('hex');
		return {hashPassword};
	},
	saveinstitutiondetails: async(id,value)=>{	
	
		if(value.purpose == 'study'){
			
			return await models.Institution_details.update({
				studyrefno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail,
				university_name:value.purposecompany_name,
                contact_number: value.purposecontact_number,
                contact_person: value.purposecontact_person
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'employment'){
			
			return await models.Institution_details.update({
				emprefno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail,
				university_name:value.purposecompany_name,
                contact_number: value.purposecontact_number,
                contact_person: value.purposecontact_person
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'IQAS'){
			
			return await models.Institution_details.update({
				iqasno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'CES'){
			
			return await models.Institution_details.update({
				cesno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'ICAS'){
			
			return await models.Institution_details.update({
				icasno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'MYIEE'){
			
			return await models.Institution_details.update({
				myieeno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'ICES'){
			
			return await models.Institution_details.update({
				icesno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'NASBA'){
			
			return await models.Institution_details.update({
				nasbano:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'Educational Perspective'){
			
			return await models.Institution_details.update({
				eduperno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'NCEES'){
			
			return await models.Institution_details.update({
				ncessno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'visa'){
			
			return await models.Institution_details.update({
				visarefno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail,
				university_name:value.purposecompany_name,
                contact_number: value.purposecontact_number,
                contact_person: value.purposecontact_person
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'NARIC'){
			
			return await models.Institution_details.update({
				naricno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'National Committee on Accreditation'){
			
			return await models.Institution_details.update({
				ncano:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'The National Dental Examining Board of Canada'){
			
			return await models.Institution_details.update({
				ndebno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'Educational Credential Evaluators (ECE)'){
			
			return await models.Institution_details.update({
				ecerefno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'CAPR'){
			
			return await models.Institution_details.update({
				caprno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'Educational credential evaluators WES'){
			
			return await models.Institution_details.update({
				wesno:value.purposedetails,
				address:value.purposeadd,
				emailAsWes:value.purposeemail,
				nameaswes:value.purposewename,
				lastnameaswes:value.purposesurname
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'others'){
			
			return await models.Institution_details.update({
				otheraccno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail,
				university_name:value.purposecompany_name,
				contact_number: value.purposecontact_number,
				contact_person: value.purposecontact_person
			},{
				where:{
					id : id
				}
			});
		}
		if(value.purpose == 'dembassy'){
			return await models.Institution_details.update({
				dembassyno:value.purposedetails,
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}

		if(value.purpose == 'pickup'){
			
			return await models.Institution_details.update({
				address:value.purposeadd,
				email:value.purposeemail
			},{
				where:{
					id : id
				}
			});
		}
		

	},
	getmarklistdetails :async(type,id,app_id)=>{
		return await models.userMarkList.findOne({where :{user_id :  id, app_id : app_id, type:type}});
	},
	removeCurrentYear: async(app_id,value)=>{
		if(value == "current_year"){
			return await	models.Applied_For_Details.update({
				current_year  : null
			},{
				where:{
					app_id : app_id
				}
			})
		}else{
			return await	models.Applied_For_Details.update({
				diplomaHolder  : null
			},{
				where:{
					app_id : app_id
				}
			})
		}
		
	},
	setDocumentas : async(doc_id,setas)=>{
		if(setas == 'Provisional Degree Certificate'){
			return  models.User_Transcript.update({provisional  : 1},{where:{id : doc_id}});
		}else if(setas == 'Degree Certificate'){
			return  models.User_Transcript.update({provisional  : 0},{where:{id : doc_id}});
		}
	},

	getOutward: async (app_id,type,degree) => {
		return await models.User_Course_Enrollment_Detail_Attestation.findOne({ where: {application_id: app_id , degree_type : degree , type : type}});
	},
	getOutward_attestation: async (app_id,type) => {
		return await models.User_Course_Enrollment_Detail_Attestation.findOne({ where: {application_id: app_id , type : type}});
	},
	getOutward_verification: async (app_id,type) => {
		
		return await models.MDT_User_Enrollment_Detail.findOne({ where: {application_id: app_id , MDT_type : type}});
	},

	getAllOutward: async (app_id,type) => {
		return await models.User_Course_Enrollment_Detail_Attestation.findAll({ where: {application_id: app_id , type : type}});
	},

	getsyOutwardNumber: async (app_id) => {
		return await models.SY_User_Enrollment_Detail.findOne({ where : {application_id: app_id}});
	},

destroyoutward: async (app_id,type) => {
	return await models.User_Course_Enrollment_Detail_Attestation.destroy({ where: {application_id: app_id , type : type}});
},
getAllOutward_instructional: async (app_id,type,degree) => {
	return await models.User_Course_Enrollment_Detail_Attestation.findAll({ where: {application_id: app_id , type : type,degree_type : degree}});
},
getRoles: async (user_id) => {
	return await models.Super_Role.findOne({ where: {userid : user_id},raw : true});
	
},
destroyoutward_instructional: async (app_id,type,degree) => {
	return await models.User_Course_Enrollment_Detail_Attestation.destroy({ where: {application_id: app_id , type : type,[Op.or]:[{degree_type:degree},{degree_type:''}] }});
},
getIpData: async () => {
	const apiResponse = await axios.get('https://ipapi.co/json/');
	return apiResponse.data;
},
checkverify: async (app_id) => {
	return await models.VerificationTypes.findOne({
		where:{
			app_id: app_id
		}
	})
  },
  destroyoutward_instructional_empty: async (app_id,type,degree) => {
	return await models.User_Course_Enrollment_Detail_Attestation.destroy({ where: {application_id: app_id , type : type,degree_type : ''}});
},
setVerificationTypes : (app_id,user_id,type,req) =>{
	var noOfDocs;
	models.VerificationTypes.findOne({
		where:{
			user_id : user_id,
			app_id : app_id
		}
	}).then((verificationTypes)=>{
		models.DocumentDetails.findAll({where:{app_id:app_id,user_id:user_id,type:type}}).then((documentDetails)=>{
			switch(type){
				case 'marksheet' : {
					if(documentDetails.length < verificationTypes.noOfMarksheet){
						noOfDocs = parseInt(verificationTypes.noOfMarksheet) - 1;
					}
					if(noOfDocs == 0){
						verificationTypes.update({
							marksheet : false,
							noOfMarksheet : noOfDocs
						}).then(async (updatedVerificationTypes)=>{
							models.MDT_User_Enrollment_Detail.destroy({
								where:{
									user_id:user_id,
									application_id:app_id,
									MDT_type:'marksheet'
								}
							})
							var activity = "Document Delete";
							var desc = "All documents of marksheet type deleted by "+req.user.email;
							await module.exports.activitylog(req,user_id,activity,desc,app_id,'guAdmin');
						})
					}else{
						verificationTypes.update({
							noOfMarksheet : noOfDocs
						}).then(async (updatedVerificationTypes)=>{
							
						})
					}
					
					
				}	
				break;
				case 'transcript' :{
					if(documentDetails.length < verificationTypes.noOfTranscript){
						noOfDocs = parseInt(verificationTypes.noOfTranscript) - 1;
					}
					if(noOfDocs == 0){
						verificationTypes.update({
							transcript : false,
							noOfTranscript : noOfDocs
						}).then(async(updatedVerificationTypes)=>{
							models.MDT_User_Enrollment_Detail.destroy({
								where:{
									user_id:user_id,
									application_id:app_id,
									MDT_type:'transcript'
								}
							})
							var activity = "Document Delete";
							var desc = "All documents of transcript type deleted by "+req.user.email;
							await module.exports.activitylog(req,user_id,activity,desc,app_id,'guAdmin');
						})
					}else{
						verificationTypes.update({
							noOfTranscript : noOfDocs
						}).then(async(updatedVerificationTypes)=>{
							
						})
					}
					
				}
				break;
				case 'degree':{
					if(documentDetails.length < verificationTypes.noOfDegree){
						noOfDocs = parseInt(verificationTypes.noOfDegree) - 1;
					}
					if(noOfDocs == 0){
						verificationTypes.update({
							degreeCertificate : false,
							noOfDegree : noOfDocs
						}).then(async (updatedVerificationTypes)=>{
							models.MDT_User_Enrollment_Detail.destroy({
								where:{
									user_id:user_id,
									application_id:app_id,
									MDT_type:'degree'
								}
							})
							var activity = "Document Delete";
							var desc = "All documents of degree type deleted by "+req.user.email;
							await module.exports.activitylog(req,user_id,activity,desc,app_id,'guAdmin');
						})
					}else{
						verificationTypes.update({
							noOfDegree : noOfDocs
						}).then(async (updatedVerificationTypes)=>{
							
						})
					}
					
				}
			}
		})
		
	})
},
getApplication_Details: async(app_id)=>{
return await models.Application.findOne({ where: { id: app_id } });
},
updateadminrole : async(user_id,roles)=>{
	return  models.User.update({edulab_rights  : roles},{where:{id : user_id}});
},
saveembassysdetails: async(_id,value)=>{
		return await models.dubaiembassy.update({
			name:value.studentname,
			courseName:value.CourseNameCtrl,
            passingyear:value.yearpassing_dubai,
            result:value.result_dubai,
            convocationDate:value.convocationDate_dubai,
            courseType:value.courseType_dubai,
			seatNo:value.seatno_Ctrl,
			purposeType:value.purposeType,
			enrollmentYear:value.enrollmentYear,
			collegeName:value.collegeName,
		},{
			where:{
				id : _id
			}
		});
},

getExcelDataApplication : async()=>{
	return models.Application.findAll({where  :{notes : null , [Op.or]:[{source_from : 'guattestation'},{source_from : 'gumoi'},{source_from : 'guverification'},{source_from : 'gusyverification'}]}});
},

getExcelDataPurpose : async(app_id)=>{
	return models.Institution_details.findAll({where  :{ app_id : app_id }});
},
getExcelDataAppliedFor : async(app_id)=>{
	return models.Applied_For_Details.findOne({where  :{ app_id : app_id }});
},
getDataAppliedFor : async(app_id)=>{
	return models.DocumentDetails.findOne({where:{ app_id : app_id }});
},
getDataPurpose : async(app_id)=>{
	return models.InstituteDetails.findAll({where:{app_id : app_id}});
},
getDataverificationtypes : async(app_id)=>{
	return models.VerificationTypes.findOne({where:{app_id : app_id}})
},
getDatadegree : async(course_name) => {
	return models.Program_List.findOne({where:{course_name : course_name}});
}

}