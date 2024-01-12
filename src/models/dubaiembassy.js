"use strict"
module.exports = function(sequelize, DataTypes) {
  var dubaiembassy = sequelize.define("dubaiembassy", {
    courseName: DataTypes.STRING(255),
    passingyear: DataTypes.STRING(255),
    name: DataTypes.STRING(255),
    convocationDate: DataTypes.STRING(255),
    type: DataTypes.STRING(255),
    result: {
      type: DataTypes.ENUM('Distinction','First Class','Higher Second Class','Second Class','Pass Class','Successful','Outstanding - Explary','Fail/ATKT'),
      allowNull: false,
      defaultValue: 'Successful'
  },
  courseType: {
      type: DataTypes.ENUM('Special','Regular','External'),
      allowNull: false,
      defaultValue: 'Special'
  },
  seatNo: DataTypes.STRING(255),
  purposeType: DataTypes.STRING(255),
  enrollmentYear: DataTypes.STRING(255),
collegeName: DataTypes.STRING(500),
},
  
{
  sequelize,
  tableName: 'dubaiembassy',
  timestamps: true,
  createdAt: "created_at", // alias createdAt as created_at
  updatedAt: "updated_at", 
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
  dubaiembassy.associate = (models) => {
    dubaiembassy.belongsTo(models.User, {foreignKey: 'user_id'});
    dubaiembassy.belongsTo(models.Application, {foreignKey: 'app_id'});
  };

  dubaiembassy.getdubaiembassyData = function(user_id){
    var query = "select * from dubaiembassy where user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  dubaiembassy.dubaiembassydata = function(id){
    var query = "select * from dubaiembassy where id = " + id;
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
 return dubaiembassy;
};