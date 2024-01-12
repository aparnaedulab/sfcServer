const express = require('express');
const router = express.Router();
const config = require('config');
var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');
const request = require('request');
const { FILE_LOCATION } = config.get('path');
const { serverUrl, clientUrl } = config.get('api');
var Moment = require('moment-timezone');
var urlencode = require('urlencode');
var ccav = require("./ccavutil");
var qs = require('querystring');
const { json } = require('body-parser');
var self_PDF = require('../invoiceTemplate');
var moments = require("moment");
var functions = require(root_path+'/utils/function');

var paymentGatewayMode = 'live';//'live'; // live OR test
var workingKey = '';
var accessCode = '';
var secureUrl = '';
var merchant_id = '';
var currency;
var serverurl = serverUrl;
var clienturl = clientUrl;

//Nodedev payment gateway - for testing
if (paymentGatewayMode == 'live') {
    //Live payment gateway
    merchant_id = '942196';
    workingKey = '5A71B5A3ABE662B81BEB3B29D33A7815';
    accessCode = 'AVNT49JJ46BT37TNTB'; //
    secureUrl = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
    currency = 'INR';
}
else
{
   //
    //for local
    workingKey = '19220C811E78848B76420041521DC0E1';
    accessCode = 'AVXY02GC57AA32YXAA'; //
    secureUrl = 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
}

router.post('/paymentrequest', (req, res, next)=> {
    var currentdate = new Date();
    var year = currentdate.getFullYear();
    year = year.toString().substr(-2);
    var total_amount
    if (req.body.user_id == 128) {
        total_amount = 1;
    } else {
        total_amount = req.body.amount;

    }

    var transaction_id = req.body.user_id + "Y" + year + "M" + (currentdate.getMonth() + 1) + "D" + currentdate.getDate() + "T" + currentdate.getHours() + currentdate.getMinutes() + currentdate.getSeconds();

    models.Orders.findOne({
        where: {
            user_id: req.body.user_id,
            amount: total_amount,
            status: '0'
        }
    }).then(function (order_exists) {
        if (order_exists) {
            var paymentData = {
                merchant_id: merchant_id,
                order_id: order_exists.id,
                currency: currency,
                amount: total_amount,
                redirect_url: serverurl + "payment/success-redirect-url",
                cancel_url: serverurl + "payment/cancel-redirect-url",
                language: 'EN',
                billing_name: req.body.app_name,
                billing_address: '',
                billing_city: "",
                billing_state: "",
                billing_zip: "",
                billing_country: 'India',
                billing_tel: "",
                billing_email: req.body.app_email,
                merchant_param1: req.body.app_name,
                merchant_param2: req.body.app_email,
                merchant_param3: 'https://guverify.studentscenter.in',
                merchant_param4: req.body.user_id,
                merchant_param5: transaction_id
            };
            var bodyJson = JSON.parse(JSON.stringify(paymentData));
            var data = '';
            var i = 0;
            for (var attr in bodyJson) {
                if (i) { data = data + '&'; } i = 1;
                data = data + attr + '=' + encodeURIComponent(bodyJson[attr]);
            }

            var encRequest = ccav.encrypt(data, workingKey);
            var viewdata = {
                secureUrl: secureUrl,
                encRequest: encRequest,
                accessCode: accessCode
            }

            res.json({
                status: 200,
                data: viewdata
            })
        } else {
            models.Orders.getThreeDigit().then(function (getid) {
                var last_id = getid[0].MAXID;
                incremented_Id = parseInt(last_id) + 01;
                models.Orders.create({
                    id: incremented_Id,
                    user_id: req.body.user_id,
                    timestamp: Moment(new Date()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                    amount: total_amount,
                    status: '0',
                    source : 'guverification'
                }).then(function (order_created) {
                    if (order_created) {
                        var paymentData = {
                            merchant_id: merchant_id,
                            order_id: order_created.id,
                            currency: currency,
                            amount: total_amount,
                            redirect_url: serverurl + "payment/success-redirect-url",
                            cancel_url: serverurl + "payment/cancel-redirect-url",
                            language: 'EN',
                            billing_name: req.body.app_name,
                            billing_address: '',
                            billing_city: "",
                            billing_state: "",
                            billing_zip: "",
                            billing_country: 'India',
                            billing_tel: "",
                            billing_email: req.body.app_email,
                            merchant_param1: req.body.app_name,
                            merchant_param2: req.body.app_email,
                            merchant_param3: 'https://guverify.studentscenter.in',
                            merchant_param4: req.body.user_id,
                            merchant_param5: transaction_id
                        };
                        var bodyJson = JSON.parse(JSON.stringify(paymentData));
                        var data = '';
                        var i = 0;
                        for (var attr in bodyJson) {
                            if (i) { data = data + '&'; } i = 1;
                            data = data + attr + '=' + encodeURIComponent(bodyJson[attr]);
                        }
                        var encRequest = ccav.encrypt(data, workingKey);
                        var viewdata = {
                            secureUrl: secureUrl,
                            encRequest: encRequest,
                            accessCode: accessCode
                        }

                        res.json({
                            status: 200,
                            data: viewdata
                        })
                    }
                });
            })
        }
    });
});

router.post('/success-redirect-url',  function (req, res) {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    var ccavEncResponse = '',
        ccavResponse = '',
        ccavPOST = '';
    var total_amount;
    var outercounter = 0;

    var bodyJson = JSON.parse(JSON.stringify(req.body));
    var data = '';
    var i = 0;
    for (var attr in bodyJson) {
        if (i) { data = data + '&'; } i = 1;
        data = data + attr + '=' + encodeURIComponent(bodyJson[attr]);
    }



    ccavEncResponse += data;
    ccavPOST = qs.parse(ccavEncResponse);
    var encryption = ccavPOST.encResp;
    ccavResponse = ccav.decrypt(encryption, workingKey);

    var pData = [];
    var obj = qs.parse(ccavResponse);
    if (obj.order_status == "Success") {
        total_amount = obj.mer_amount;
        models.Orders.findOne({
            where: {
                id: obj.order_id
            }
        }).then(function (order) {
            models.Transaction.create({
                order_id: order_updated.id,
                tracking_id: obj.tracking_id,
                bank_ref_no: obj.bank_ref_no,
                order_status: obj.order_status,
                payment_mode: 'online',
                currency: 'INR',
                amount: total_amount,
                billing_name: application.name,
                billing_tel: '',
                billing_email: application.email,
                merchant_param1: obj.merchant_param1,
                merchant_param2: obj.merchant_param2,
                merchant_param3: obj.merchant_param3,
                merchant_param4: obj.merchant_param4,
                merchant_param5: obj.merchant_param5,
                split_status: '-1'
            }).then(function (transaction_created) {
                if (transaction_created) {
                    models.Application.create({
                        tracker : 'apply',
                        status : 'new',
                        total_amount: total_amount,
                        user_id : obj.merchant_param4,
                        source_from : 'guverification'
                    }).then(function(application){
                        order.update({
                            application_id: application.id,
                            timestamp: Moment(new Date()).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
                            amount: total_amount,
                            status: '1'
                        }).then(function (order_updated) {
                            setApplicationID(user_id,application.id);
                            applicationCreationMail(user_id,application.id);
                            createEnrollmentNumber(user_id,application.id, application.created_at);
                            models.Activitytracker.create({
                                activity : "Payment",
                                data :obj.merchant_param2+" has been made payment for application "+application.id + ' for Verification',
                                application_id : application.id,
                                source :'guverification',
                                ipAddress:clientIP,
                                // location:Location,
                                // ip_data:ipdata
                            });
                            res.redirect(clienturl + "pages/FirstSuccess?order_id=" + obj.order_id);
                        })
                    })
                    
                }
            });
        });
    } else {
        models.Orders.findOne({
            where:
            {
                id: obj.order_id
            }
        }).then(function (ord) {
            if (obj.order_status == 'Failure') {
                ord.update({
                    status: '-1'
                }).then(function (updated) {
                    res.redirect(clienturl + "pages/FirstFailure?order_status=" + obj.order_status);
                })
            } else if (obj.order_status == 'Timeout') {
                ord.update({
                    status: '2'
                }).then(function (updated) {
                    res.redirect(clienturl + "pages/FirstFailure?order_status=" + obj.order_status);
                })
            } else if (obj.order_status == 'Aborted') {
                ord.update({
                    status: '3'
                }).then(function (updated) {
                    res.redirect(clienturl + "pages/FirstFailure?order_status=" + obj.order_status);
                })
            } else if (obj.order_status == 'Invalid') {
                ord.update({
                    status: '4'
                }).then(function (updated) {
                    res.redirect(clienturl + "pages/FirstFailure?order_status=" + obj.order_status);
                })
            } else {
                ord.update({
                    status: '5'
                }).then(function (updated) {
                    res.redirect(clienturl + "pages/FirstFailure?order_status='error'");
                })
            }
        });
    }

    function setApplicationID(user_id, app_id){
        models.VerificationTypes.setAppId(user_id,app_id).then(function(verificationTypes){
            models.DocumentDetails.setAppId(user_id,app_id).then(function(documentDetails){
                models.InstituteDetails.setAppId(user_id,app_id).then(function(instituteDetails){
                });
            })
        })
    }
    function applicationCreationMail(user_id,app_id){
        models.User.findOne({
            where:{
                id : user_id
            }
        }).then(function(user){
            models.VerificationTypes.find({
                where : {
                    user_id : user_id,
                    app_id : app_id,
                    source_from:source_from
                }
            }).then(function(verificationTypes){
                models.DocumentDetails.findOne({
                    where :{
                        user_id : user_id,
                        app_id :  app_id
                    }
                }).then(function(docDetails){
                    var verificationData = {
                        marksheet : (verificationTypes.marksheet) ? verificationTypes.noOfMarksheet : 0,
                        transcript : (verificationTypes.transcript) ? verificationTypes.noOfTranscript : 0,
                        degreeCertificate : (verificationTypes.degreeCertificate) ? verificationTypes.noOfDegree : 0,
                        sealedCover : (verificationTypes.sealedCover) ? 'Yes' : 'No',
                        secondYear : (verificationTypes.secondYear) ? 'Yes' : 'No'
                    };

                    var url =config.get('email').BASE_URL_SENDGRID + 'applicationGenerate';
            
                    request.post( url, {
                        json: {
                        userName: user.name + ' ' + user.surname,
                        email: user.email,
                        app_id : app_id,
                        source : 'verification',
                        verificationData : verificationData,
                        sendTo : 'student'
                        }
                    }, function (error, response, body) {
                        request.post( url, {
                            json: {
                            userName: user.name ,
                            useEmail : user.email,
                            courseName : docDetails.courseName,
                            email: 'admin@admin.in',
                            app_id : app_id,
                            source : 'verification',
                            sendTo : 'admin'
                            }
                        }, function (error, response, body) {
                        });
                        

                    });
                })
            })
           
        })
    }

    function createEnrollmentNumber(user_id,app_id, app_date){
        models.VerificationTypes.findOne({
            where :{
                user_id : user_id,
                app_id : app_id,
                source_from:source_from
            }
        }).then(function(verification){
            if(verification.marksheet == true || verification.transcript == true || verification.degreeCertificate == true){
                models.MDT_User_Enrollment_Detail.getListLastData().then(function(lastData){
                   var enrollment_no;
                    if(lastData.length > 0){
                        enrollment_no = parseInt(lastData[0].enrollment_no) + 1;
                    }else{
                        enrollment_no = 10001;
                       
                    }

                    models.MDT_User_Enrollment_Detail.create({
                        enrollment_no: enrollment_no,
                        application_date: app_date,
                        user_id :user_id,
                        application_id : app_id,
                    });
                })
                
            }

            if(verification.secondYear == true){
                models.SY_User_Enrollment_Detail.getListLastData().then(function(lastData){
                    var enrollment_no;
                     if(lastData.length > 0){
                         enrollment_no = parseInt(lastData[0].enrollment_no) + 1;
                     }else{
                         enrollment_no = 10001;
                        
                     }
 
                     models.SY_User_Enrollment_Detail.create({
                         enrollment_no: enrollment_no,
                         application_date: app_date,
                         user_id :user_id,
                         application_id : app_id,
                     });
                 })
            }
        })
    }
});


router.post('/cancel-redirect-url', function (req, res) {
    res.redirect(clienturl + "pages/FirstCancel");
});

router.post('/PaymentDetails', function (req, res) {
    var view_data = {};
    models.Orders.findOne({
        where:
        {
            id: req.body.order_id,
            source: "guverification"
        }
    }).then(function (order) {
        if (order) {
            models.Transaction.findOne({
                where:
                {
                    order_id: order.id
                }
            }).then(function (transaction) {
                if (transaction) {
                    models.Feedback.findOne({
                        where:{
                            user_id : order.user_id,
                            source : 'guVerification'
                        }
                    }).then(function(feedback){
                        if(feedback){
                            view_data.feedback = true;
                        }else{
                            view_data.feedback = false;
                        }
                        view_data.transaction_id = transaction.merchant_param5;
                        view_data.payment_amount = "INR " + transaction.amount;
                        view_data.payment_amount_words = converter.toWords(transaction.amount);
                        view_data.payment_status = transaction.order_status;
                        view_data.payment_date_time = moments(transaction.created_at).format("DD/MM/YYYY HH:MM");
                        view_data.application_id = order.application_id;
                        view_data.user_id = order.user_id;

                        res.json({
                            status: 200,
                            data: view_data
                        })
                    })
                }
            })
        }
    })
});

router.post('/OnlinePaymentChallan', function (req, res) {
    var userId = req.body.user_id;
    models.User.findOne({
        where: {
            id:req.body.user_id
        }
    }).then(function(user){
        models.Application.findOne({
            where: {
                 id: req.body.application_id
            }
        }).then(function (appl) {
            models.Orders.findOne({
                where: {
                    application_id: req.body.application_id,
                    status: '1'
                }
            }).then(function (orders) {
                if (orders) {
                    models.Transaction.findOne({
                        where:
                        {
                            order_id: req.body.order_id
                        }
                    }).then(function (trans) {
                        receiptno = orders.id;
                        date = moments(trans.created_at).format("DD-MM-YYYY HH:MM");
                        amount_words = converter.toWords(trans.amount);
                        self_PDF.receipt_pdf(userId,req.body.application_id,trans.tracking_id,trans.order_id,trans.amount,trans.order_status,trans.created_at,user.email,amount_words,function (err) {
                            if (err) {
                                res.send({ status: 400, data: err })
                            } else {
                                setTimeout(function () {
                                    res.send({ status: 200,data: req.body.application_id + "_Verification_Payment_Challan.pdf" });

                                }, 3000);
                            }
                        });
                    });
                }
            })
        })
    })
})

router.post('/feedBack', function(req, res) {
	models.Feedback.findOne({
		where:{
			user_id : req.body.user_id,
            source:"guverification"
		}
	}).then(function(feedbackExists){
		if(feedbackExists){
			feedbackExists.update({
				website_satisfy: req.body.satisfy,
			    website_recommend: req.body.recommend,
		    	staff_satisfy: req.body.staff,
		    	experience_problem :req.body.experience,
		    	problem: req.body.exp_prob,
		    	suggestion: req.body.suggestion,
			}).then(function(feedbackRecorded){
				if(feedbackRecorded){
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
			models.Feedback.create({
				website_satisfy: req.body.satisfy,
			    website_recommend: req.body.recommend,
		    	staff_satisfy: req.body.staff,
		    	experience_problem :req.body.experience,
		    	problem: req.body.exp_prob,
		    	suggestion: req.body.suggestion,
		    	user_id : req.body.user_id,
                source:"guverification"
			}).then(function(feedbackRecorded){
				if(feedbackRecorded){
                    if(feedbackRecorded.website_satisfy == 'can_improve' || feedbackRecorded.website_satisfy == 'Unsatisfy'
                    || feedbackRecorded.staff_satisfy == 'Unsatisfy' || feedbackRecorded.staff_satisfy == 'can_improve'){
                        models.User.findOne({
                            where:{
                                id : req.body.user_id
                            }
                        }).then(function(user){
                            var url =config.get('email').BASE_URL_SENDGRID + 'improvementFeedback';
                            request.post(url, {
                                json: {
                                    email : user.email,
                                    name : user.name + ' ' + user.surname,
                                    source : 'guverification'
                                }
                            });
                            res.json({
                                status : 200
                            })
                        })
                    }else{
                        res.json({
                            status : 200
                        })
                    }
				}else{
					res.json({
						status : 400
					})
				}
			})
		}
	})
});

/*
    Merge all uploaded documents with cover letter
    parameter : user_id and app_id
 */
    router.get('/mergeDocuments', function (req, res) {
        var user_id = req.query.user_id;
        var app_id = req.query.app_id;
        var mergeAllUserDocuments = "";
        models.DocumentDetails.findAll({
            where:{
                user_id : user_id,
                app_id : app_id,
            }
        }).then(function (printData) {
            let mergeDocumentsPromise = new promises((resolve,reject)=>{
                printData.forEach(student => {
                    var name = student.file;
                    var split1 = name.split('.');
                    var exte = split1.pop();
                    var file = split1[0];
                    var signedfile_doc = constant.FILE_LOCATION + "public/upload/documents/" + student.user_id + "/" + student.file;
                    if ((exte == "jpg" || exte == "jpeg" || exte == "png" || exte == "JPG" || exte == "JPEG" || exte == "PNG" ) && fs.existsSync(signedfile_doc)) {
                        var outputfile = constant.FILE_LOCATION + "public/upload/documents/" + student.user_id + "/" + file + ".pdf";
                        var imgTopdf = [signedfile_doc];
                        setTimeout(() => {
                            fn.imagetopdf(imgTopdf, outputfile)
                        }, 1000);
                        // mergeAllUserDocuments.push(outputfile);
                        mergeAllUserDocuments = mergeAllUserDocuments +' "'+constant.FILE_LOCATION + 'public/upload/documents/' + student.user_id + '/' + file + '.pdf"';
                    } else if (fs.existsSync(signedfile_doc)) {
                        // mergeAllUserDocuments.push(signedfile_doc);
                        mergeAllUserDocuments = mergeAllUserDocuments +' "'+constant.FILE_LOCATION + 'public/upload/documents/' + student.user_id + '/' + file + '.pdf"';
                    }
                });
    
                resolve('true');
            });
    
            mergeDocumentsPromise.then((value)=>{
                var outputMergefile = constant.FILE_LOCATION+"public/upload/documents/"+user_id + "/" +app_id +"_UploadedDocument_Merge.pdf";
                self_PDF.merge(mergeAllUserDocuments,outputMergefile,function(err){
                    if(err){
                        return res.json({
                            status : 400
                        })
                    }else{
                        res.json({
                            status : 200
                        })
                    }
                })
                
            })
        })
    })

module.exports = router;