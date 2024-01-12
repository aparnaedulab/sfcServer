/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

const { ObjectID } = require('mongodb');
const BaseRepository = require('../../../db/baseRepository');
const models = require( '../../../models/index');
class UserRepository extends BaseRepository {
  constructor() {
    super('User');
  }

  findById(id) {
    return models.User.findByPk(id);
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //     .aggregate([
    //       { $match: { _id: ObjectID(id) } },
    //       {
    //         $lookup: {
    //           from: 'settings',
    //           localField: '_id',
    //           foreignField: '_id',
    //           as: 'settings',
    //         },
    //       },
    //       { $limit: 1 },
    //     ])
    //     .toArray())dsssssss
    //   .then(data => (data && data.length ? data[0] : data));
  }


  findByEmail(email) {
    return models.User.findOne({ where: { email: email } });
    
  }

  add(user){
    return models.User.create({
      email: user.email,
      name : user.name,
      surname : user.surname,
      marksheetName : user.marksheetName,
      user_status : user.user_status,
      user_type: user.user_type,
      password :user.password,
      mobile_country_code: user.mobile_country_code,
      email_verification_token : user.email_verification_token,
      is_email_verified : 0,
      mobile : user.mobile,
      otp:user.otp,
      is_otp_verified : user.is_otp_verified,
      postal_code : ''
    })
  }

  findAllUsersByEmail(email) {
    return models.User.findAll({ where: { email: email } });
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //     .find({ email })
    //     .toArray());
  }

  updateVerificationToken(token) {
    return models.User.update({is_email_verified : 1, email_verification_token : null}, {
      where: {
        email_verification_token : token
      }})
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //     .updateOne({ _id: ObjectID(id) }, { $set: { salt, passwordHash } }));
  }
  
  changePassword(id,password) {
    return models.User.update({password : password}, {
      where: {
        id :id
      }})
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //     .updateOne({ _id: ObjectID(id) }, { $set: { salt, passwordHash } }));
  }

  listFiltered(filter) {
    const listFilter = this._getListFilter(filter);

    return super.listFiltered(listFilter);
  }

  getCountFiltered(filter) {
    const listFilter = this._getListFilter(filter);

    return super.getCountFiltered(listFilter);
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };

    copyFilter.query = {};

    // names here are not fully consistent with naming convention for compatibility with ng2-smart-table api on UI
    if (copyFilter.filterByfirstName) {
      copyFilter.query.firstName = { $regex: copyFilter.filterByfirstName, $options: '-i' };
    }
    if (copyFilter.filterBylastName) {
      copyFilter.query.lastName = { $regex: copyFilter.filterBylastName, $options: '-i' };
    }
    if (copyFilter.filterBylogin) {
      copyFilter.query.fullName = { $regex: copyFilter.filterBylogin, $options: '-i' };
    }
    if (copyFilter.filterByemail) {
      copyFilter.query.email = { $regex: copyFilter.filterByemail, $options: '-i' };
    }
    if (copyFilter.filterByage) {
      copyFilter.query.age = copyFilter.filterByage;
    }
    if (copyFilter.filterBystreet) {
      copyFilter.query['address.street'] = { $regex: copyFilter.filterBystreet, $options: '-i' };
    }
    if (copyFilter.filterBycity) {
      copyFilter.query['address.city'] = { $regex: copyFilter.filterBycity, $options: '-i' };
    }
    if (copyFilter.filterByzipcode) {
      copyFilter.query['address.zipCode'] = { $regex: copyFilter.filterByzipcode, $options: '-i' };
    }

    return copyFilter;
  }

  // TODO: implement photo return
  getPhoto(userId) {
    const defaultFileName = 'default-img.jpg';

    return Promise.resolve(defaultFileName);
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //   )
  }
}

module.exports = UserRepository;
