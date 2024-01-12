
"use strict"

module.exports = function(sequelize, DataTypes) {
var wesrecords = sequelize.define("Wes_Records", {
    userId: DataTypes.INTEGER,
    fileName: DataTypes.STRING(255),
    reference_no : DataTypes.INTEGER(11),
    status:DataTypes.STRING(255),
    wesnumber:DataTypes.STRING(255),
    appl_id:DataTypes.INTEGER
 });
 return wesrecords;
};