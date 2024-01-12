"use strict";
module.exports = function(sequelize, DataTypes) {
  var College = sequelize.define("College", {
    name: DataTypes.STRING(100),
    college_code : DataTypes.STRING(100),
    emailId: DataTypes.STRING(100),
    contactNo: DataTypes.STRING(17),
    contactPerson : DataTypes.STRING(100),
    alternateContactPerson : DataTypes.STRING(100),
    alternateContactNo : DataTypes.STRING(17),
    alternateEmailId : DataTypes.STRING(100),
    status  : DataTypes.ENUM('active', 'inactive'),
    type : DataTypes.STRING(20),
    affiliation:DataTypes.STRING(250),
},
{
 sequelize,
 tableName: 'College',
 timestamps: true,
 createdAt:"created_at",
 updatedAt:"updated_at",
 indexes: [
     {
         name: "PRIMARY",
         unique: true,
         using: "BTREE",
         fields: [
             { name: "id" },
         ]
     },
 ]
});
// College.getColleges = function(){
//   var query = "SELECT * FROM College ORDER BY name";
//   return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
// }
College.getcollege= function() {
    var query = 'SELECT DISTINCT name FROM College';
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
};
College.getAllColleges = function(limit,offset){
  var limitOffset = '';
  if (limit != null && offset != null) {
    limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  }
  var query = "SELECT * FROM College ORDER BY name";
  query += limitOffset;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
}

College.updateCollege = function(college_name, college_Address,category,id){
  var query = 'Update College set name = "'+college_name+'", college_code = "'+ college_Address  +'",affiliation = "'+ category  +'"  where id = "'+ id +'"';
  return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
};
return College;
};
