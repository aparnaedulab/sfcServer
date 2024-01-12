/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

const express = require('express');

const router = express.Router();
const { adminGuard } = require('../auth/aclService');
const UserService = require('./userService');
const CustomErrorService = require('../../../utils/customErrorService');
var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');

const userService = new UserService();

router.get('/', adminGuard, (req, res) => {
  userService
    .list(req.query)
    .then(users => res.send(users));
});

router.post('/', adminGuard, (req, res) => {
  userService
    .addUser(req.body)
    .then(user => res.send(user))
    .catch(err => res.status(400).send({ error: err.message }));
});

router.get('/current', (req, res) => {
  userService
    .findById(req.user.id)
    .then(user => {
      models.Super_Role.findOne({
        where:{
          userid : req.user.id
        }
      }).then(function(superRole){
        // console.log('superRolesuperRolesuperRole' , superRole)
        var pages = '';
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
        }else if(superRole.superCourier){
          pages += 'superCourier';
        }else if(superRole.superPrint){
          pages += 'superPrint';
        }else if(superRole.superSent){
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
        user.landingPage = pages;
        res.send(user);
      })
    });

});

router.put('/current', (req, res) => {
  userService
    .editCurrentUser(req.body, req.user.id)
    .then(user => res.send(user))
    .catch(error => {
      if (error instanceof CustomErrorService) {
        res.status(error.metadata && error.metadata.error.code)
          .send(error);
      }
    });
});

router.get('/:id', adminGuard, (req, res) => {
  userService
    .findById(req.params.id)
    .then(user => res.send(user));
});

router.put('/:id', adminGuard, (req, res) => {
  userService
    .editUser(req.body, req.params.id)
    .then(user => res.send(user))
    .catch(error => {
      if (error instanceof CustomErrorService) {
        res.status(error.metadata && error.metadata.error.code)
          .send(error);
      }
    });
});

router.delete('/:id', adminGuard, (req, res) => {
  userService
    .deleteUser(req.params.id)
    .then(() => res.send({ id: req.params.id }));
});

module.exports = router;
