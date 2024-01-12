/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

const UserService = require('./common/user/userService');
const cipher = require('./common/auth/cipherHelper');
const logger = require('../utils/logger');
const AuthService = require('../api/common/auth/authService');
const authService = new AuthService();
var path = require('path');
var root_path = path.dirname(require.main.filename);
var models = require(root_path + '/models');

class SeedService {
  checkAndSeed() {
    logger.info('Seed Data')

    let users = models.User.findAll({}).then( data => {
  
      if(data.length == 0){
        this.seeding().then();
      }
    });
}
 
async seeding() {
  try {
    logger.info('Seed Data');
    const newUser = {
      email: 'admin@edulab.in',
      name : 'Admin',
      marksheetName : null,
      user_status : 'active',
      user_type: 'admin',
      password: 'edulab123',
      mobile_country_code : '91',
      mobile : '9309848291',
      otp : '123456',
      is_otp_verified : true,
      surname : null
      //salt: hash.salt,
      //passwordHash: hash.passwordHash,
    };

    await authService.registerAdmin(newUser);

//      await this.addCustomUsers();
    logger.info('Seed Users Done');
  } catch (err) {
    logger.error(err);
  }
}
  //automatic create seeding user
//   async createTrigger(){

//     models.sequelize.query('DROP TRIGGER IF EXISTS `application_update_trigg`;')
//     models.sequelize.query(' CREATE TRIGGER application_update_trigg '+
//     ' AFTER UPDATE '+
//     ' ON application FOR EACH ROW '+
//     ' BEGIN '+
//             ' INSERT INTO errataHistory(first_name, last_name, userId, userEmail, seat_number, payment_status, stream, branch, semester, document, request_type, college_name, year_passing, email, mobile, choose_file, created_by, createdAt, updatedAt) '+
//             ' values(OLD.first_name, OLD.last_name, OLD.userId, OLD.userEmail, OLD.seat_number, OLD.payment_status, OLD.stream, OLD.branch, OLD.semester, OLD.document, OLD.request_type, OLD.college_name, OLD.year_passing, OLD.email, OLD.mobile, OLD.choose_file, OLD.created_by,OLD.createdAt, OLD.updatedAt); '+
//     ' END ;')
//     logger.info("application_update_trigger created")


// } 

}

module.exports = SeedService;
