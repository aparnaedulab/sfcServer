/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

const { ObjectID } = require('mongodb');
const getMongoDBClient = require('../db/mongodbClient');
const models = require( '../models/index');
class BaseRepository {
  constructor(collectionName) {
  //  this.dbClient = getMongoDBClient();
    this.collection = collectionName;
  }

  getCount() {
    models.User.findAndCountAll({
    }).then(entries => {
      return entries.count

    }).catch(err => {
      return 0
    })
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //     .countDocuments());
  }

  getCountFiltered(filter = {}) {
    models.User.findAndCountAll({
      where: {email: filter.query},
    }).then(entries => {
      return entries.count;
    
    }).catch(err => {
    })

    
  }

  findById(id) {
   return models.User.findByPk(id);
  }

  add(item) {
    return models.User.create(item);
  }

  addMany(items) {
    return models.User.bulkCreate(items);
  }

  edit(id, item) {
    return models.User.update(item, {
      where: {
        id :id
      }})
      
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //     .updateOne({ _id: ObjectID(id) }, { $set: item }, { upsert: true }));
  }

  delete(id) {
    return models.User.destroy({
      where : {id : id}
    })
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //     .remove({ _id: ObjectID(id) }));
  }

  list() {
    return models.User.findAll();
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //     .find());
  }

  listFiltered(filter) {
    //TODO : create proper sorting 
    models.User.findAll({
      where: {email: filter.query},
    }).then(entries => {
      return entries;
    
    }).catch(err => {
    })
    }
}

module.exports = BaseRepository;
