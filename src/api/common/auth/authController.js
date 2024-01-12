/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

const express = require('express');
const passport = require('passport');

const cipher = require('../auth/cipherHelper');
const AuthService = require('./authService');

const router = express.Router();
const authService = new AuthService();
const auth = passport.authenticate('jwt', { session: false });
const config = require('config');
var request = require('request');
var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');
var functions = require(root_path+'/utils/function');

router.post('/login', (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  passport.authenticate('local', { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).send({
        error: err ? err.message : 'Login or password is wrong',
      });
    }
    user.email=req.body.email;
    req.login(user, { session: false }, (error) => {
      if (error) {
        res.send(error);
      }
      models.User.findOne({
        where: {
          email: req.body.email
        }
      }).then(function (userData) {
        userData.update({
          is_otp_verified: false,
          is_email_verified: false,
        }).then(user=>{
        models.Activitytracker.create({
          user_id: user.id,
          activity: "Login",
          data: user.name + " " + user.surname + " has Loged In with email id  " + user.email,
          application_id: null,
          source: "guAdmin",
          ipAddress:clientIP,
          // location:Location,
          // ip_data:ipdata
     


        }).then(() => {
          return
        }).catch((error) => {

          console.error('Error:', error);
        });
        var pages = '/pages/';
        if(user.user_type == 'subAdmin') {
          models.Super_Role.findOne({
            where:{
              userid : user.id
            }
          }).then(function(superRole){
            if(superRole.superDashboard){
              pages += 'superDashboard';
            }else if(superRole.superStudentManagement){
              pages += 'superStudentManagement';
            }else if(superRole.supercollegeManagement){
              pages += 'supercollegeManagement';
            }else if(superRole.supertotalapplication){
              pages += 'superTotal';
            }else if(superRole.superPending){
              pages += 'superPending';
            }else if(superRole.superVerified){
              pages += 'superVerified';
            }else if(superRole.superSigned){
              pages += 'superSigned';
            }else if(superRole.printedulab){
              pages += 'superPrintbyEdulab';
            }
            else if(superRole.superPrint){
              pages += 'superPrint';
            }
            else if(superRole.superSent){
              pages += 'superSent';
            }else if(superRole.superPayment){
              pages += 'superPayment';
            }else if(superRole.superReport){
              pages += 'superReport';
            }else if(superRole.superfeedback){
              pages += 'superFeedback';
            }else if(superRole.help){
              pages += 'help';
            }else if(superRole.superrolemanagement){
              pages += 'superRoleManagement';
            }else if(superRole.superFileManagement){
              pages += 'superFileManagement';
            }
            const response = { token: cipher.generateResponseTokens(user,pages)};
            res.send(response);
          })
        }else{
          pages += "superDashboard";
          const response = { token: cipher.generateResponseTokens(user,pages)};
            res.send(response);

        }
        })
      });
      
    });
  })(req, res);
});


router.post('/sign-up', (req, res) => {
  var emailVerificationToken = require('shortid').generate();
  authService
    .register(req.body,emailVerificationToken)
    .then(user => {
      const response = { token: cipher.generateResponseTokens(user) };
      var url =config.get('email').BASE_URL_SENDGRID + 'studentOTP';
      request.post( url, {
        json: {
          mobile: user.mobile,
          mobile_country_code: user.monile_country_code,
          userName: user.name,
          email: user.email,
          password : req.body.password,
          email_verification_token: emailVerificationToken,
          source : 'verification'
        }
      }, function (error, response, body) {
            models.Activitytracker.create({
            user_id : user.id,
            activity : "Registration",
            data : user.name+" "+user.surname+" has registered with email id "+user.email,
            application_id : null,
            source :'guverification'
          });
      });
      res.send(response);
    })
    .catch(err => res.status(400).send({ error: err.message }));
});

router.post('/reset-pass', auth, (req, res) => {
  const { id } = req.user;
  const { password, confirmPassword, resetPasswordToken } = req.body;

  authService
    .resetPassword(password, confirmPassword, id, resetPasswordToken)
    .then(() => res.send({ message: 'ok' }))
    .catch(err => {
      res.status(400).send({ error: err.message });
    });
});

router.post('/request-pass', (req, res) => {
  const { email } = req.body;
  authService
    .requestPassword(email)
    .then(() => res.send({ message: `Email with reset password instructions was sent to email ${email}.` }))
    .catch((error) => {
      res.status(400).send({ data: { errors: error.message } });
    });
});

router.post('/sign-out', (req, res) => {
  res.send({ message: 'ok' });
});

router.post('/refresh-token', (req, res) => {
  const token = req.body;
  authService
    .refreshToken(token.payload)
    .then(responseToken => res.send({ token: responseToken }))
    .catch(err => res.status(400).send({ error: err.message }));
});

router.get('/verify-email', function (req, res) {
  var url = config.get('frontEnd').domain + 'auth/login?verify=1';
	authService
    .verifyUser(req.query.token)
    .then(() => res.redirect(url))
    .catch(err => {
      res.status(400).send({ error: err.message });
    });
});

module.exports = router;
