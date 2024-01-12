const jwt = require('jsonwebtoken');
const config = require('config');

const UserService = require('../user/userService');
const cipher = require('./cipherHelper');
const emailService = require('../../../utils/emailService');

class AuthService {
  constructor() {
    this.userService = new UserService();
  }

  register(user,emailVerificationToken) {
    const { email } = user;
    return this.userService.findByEmail(email)
      .then(existingUser => {
       
        if (existingUser) {
          throw new Error('User already exists');
       }
        
        const { hashPassword } = cipher.generateHashPassword(user.password);
        const { randomString } = cipher.generateRandomString(6, 'numeric');
        const newUser = {
          name: user.firstName,
          marksheetName : user.fullname,
          mobile_country_code : user.mobile_country_code,
          mobile: user.mobile,
          email: user.email,
          user_status : "active",
          user_type: user.role,
          email_verification_token:emailVerificationToken,
          is_otp_verified:false,
          password : hashPassword,
          surname : user.lastName,
          otp : randomString,
        };
        return this.userService.addUser(newUser);
      })
      .then(response => {
        if (response) {
         return this.userService.findByEmail(email);
        }
      });
  }

  registerAdmin(user) {
    const { email } = user;
    return this.userService.findByEmail(email)
      .then(existingUser => {
        if (existingUser) {
          throw new Error('User already exists');
        }

        const {hashPassword} = cipher.generateHashPassword(user.password);
        const newUser = {
          email: user.email,
          name : user.name,
          user_status : user.user_status,
          user_type: user.user_type,
          password : hashPassword,
          mobile_country_code: user.mobile_country_code,
          mobile : user.mobile,
          otp:user.otp,
          is_otp_verified : user.is_otp_verified,
          surname : user.surname,
        };
        return this.userService.addUser(newUser);
      })
      .then(response => {
        if (response) {
          return this.userService.findByEmail(email);
        }
      });
  }

  verifyUser(token){
    return  this.userService.updateVerificationToken(token)
  }

  resetPassword(password, confirmPassword, userId, resetPasswordToken) {
    let currentUserId = userId;

    if (password.length < 4) {
      return Promise.reject(new Error('Password should be longer than 4 characters'));
    }

    if (password !== confirmPassword) {
      return Promise.reject(new Error('Password and its confirmation do not match.'));
    }

    if (resetPasswordToken) {
      const tokenContent = cipher.decipherResetPasswordToken(resetPasswordToken);
      currentUserId = tokenContent.userId;

      if (new Date().getTime() > tokenContent.valid) {
        return Promise.reject(new Error('Reset password token has expired.'));
      }
    }

    const { hashPassword } = cipher.generateHashPassword(password);

    return this.userService.changePassword(currentUserId, hashPassword);
  }

  refreshToken(token) {
    if (!token.access_token || !token.refresh_token) {
      throw new Error('Invalid token format');
    }

    const tokenContent = jwt.decode(
      token.refresh_token,
      config.get('auth.jwt.refreshTokenSecret'),
      { expiresIn: config.get('auth.jwt.refreshTokenLife') },
    );

    return this.userService.findById(tokenContent.id).then(user => {
      return cipher.generateResponseTokens(user);
    });
  }

  requestPassword(email) {
    return this.userService
      .findByEmail(email)
      .then(user => {
        if (user) {
          const token = cipher.generateResetPasswordToken(user._id);

          return emailService.sendResetPasswordEmail(email, user.fullName, token);
        }

        throw new Error('There is no defined email in the system.');
      })
      .catch(error => {
        throw error;
      });
  }
}

module.exports = AuthService;
