const express = require('express');
const router = express.Router();
const config = require('config');
var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');
var moment = require("moment");
const cipher = require('../common/auth/cipherHelper');
var request = require('request');


router.get('/getRegisterUser', (req, res) => {
    models.User.findAll({
        where  :{
                 user_type : 'user'
        }
    }).then(function (data) {
        if (data.length > 0) {
            res.json({
                status: 200,
                data: data
            })
               
        }else{
            res.json({
                status: 400,
                message: "Wrong Details"
            })
        }
    })
})

router.post('/checkEmail', function (req, res) {
    var reqData = req.body.data;
    models.User.findOne({
        where: {
            email: reqData
        }
    }).then(function (user) {
        if (user) {
            res.send({
                status: 400,
                message: 'Email already exists.'
            });
        }else{
            res.send({
                status: 200
            });
        }
    });
});

router.get('/get_otp', function (req, res) {
    var user_id = req.query.user_id
    models.User.findOne({
        where: {
            id: user_id
        }
    }).then(function (adminData) {
        const { randomString } = cipher.generateRandomString(6, 'numeric');
        adminData.update({
            otp: randomString
        }).then(function (user_updated) {
            var url =config.get('email').BASE_URL_SENDGRID + 'adminOtp';
            request.post(url,{
                json: {
                    mobile: adminData.mobile,
                    mobile_country_code: adminData.mobile_country_code,
                    email: adminData.email,
                    otp: user_updated.otp,
                    userName: adminData.name
                }
            }, function (error, response, body) {
                if(response != undefined){
                    if (!error && response.statusCode == 200) {
                        res.json({
                            status: 200,
                            message: 'Successfully',
                            data: adminData.otp
                        });
                    } else if (response.statusCode == 400) {
                        res.json({
                            status: 400,
                            message: 'ERROR: An error has been occurred while sending email. Please ensure email address is proper and try again.',
                            data: adminData.otp
                        });
                    }
                }else{
                    res.json({
                        status: 400,
                        message: 'ERROR: An error has been occurred while sending email. Please ensure email address is proper and try again.',
                        data: adminData.otp
                    });
                }
             
            })
        });
       
    })
});

router.get('/update_otp', function (req, res) {
    var user_id = req.query.user_id
    models.User.findOne({
        where: {
            id: user_id
        }
    }).then(function (user) {
        const { randomString } = cipher.generateRandomString(6, 'numeric');
        user.update({
            otp: randomString,
            is_otp_verified : true,
            is_email_verified : true
        }).then(function (user_updated) {
            return res.json({

                status: 200,
                data : user_updated

            })
        });

    });
});


router.get('/logOutActivity', function (req, res) {
    var email = req.query.email
    models.User.findOne({
        where: {
            email: email
        }
    }).then(function (user) {
        user.update({
            is_otp_verified : false,
            is_email_verified : false
        }).then(function (user_updated) {
            return res.json({

                status: 200,
                message: 'Successfully logged out!'

            })
        });

    });
});


module.exports = router;

