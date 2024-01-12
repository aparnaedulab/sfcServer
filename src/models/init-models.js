var DataTypes = require("sequelize").DataTypes;
var _documents = require("./verificationTypes");
var _permissions = require("./permissions");
var _settings = require("./settings");
var _users = require("./user");

function initModels(sequelize) {
  var VerificationTypes = _documents(sequelize, DataTypes);
  var Permissions = _permissions(sequelize, DataTypes);
  var Settings = _settings(sequelize, DataTypes);
  var User = _users(sequelize, DataTypes);

  return {
    VerificationTypes,
    Permissions,
    Settings,
    User,
    };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
