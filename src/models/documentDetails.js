const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  var DocumentDetails = sequelize.define('DocumentDetails', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    courseName: {
      type: DataTypes.TEXT
    },
    seatNo: {
      type: DataTypes.STRING(100)
    },
    PassingMonthYear: {
      type: DataTypes.STRING(100)
    },
    semester :{
      type : DataTypes.STRING(100)
    },
    file: {
      type: DataTypes.STRING(100)
    },
    type:{
      type: DataTypes.ENUM('marksheet', 'transcript','degree','secondYear'),
    },
    convocationDate:{
      type: DataTypes.DATE
    },
    resultClass :{
      type : DataTypes.STRING(100)
    },
    collegeName :{
      type: DataTypes.TEXT
    },
    majorSubject :{
      type: DataTypes.TEXT
    },
    courseType : {
      type : DataTypes.STRING(100)
    },
    subsidarySubject :{
      type: DataTypes.TEXT
    },
    presubsidarySubject:{
      type :  DataTypes.TEXT
    },
    enrollmentStart  :{
      type: DataTypes.STRING(100)
    },
    enrollmentEnd   :{
      type: DataTypes.STRING(100)
    },
    lock_transcript: {
      type: DataTypes.ENUM('default', 'requested','changed'),
      allowNull: false,
      defaultValue: 'default'
    },
    upload_step: {
        type: DataTypes.ENUM('default', 'requested','changed'),
        allowNull: false,
        defaultValue: 'default'
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    user_id_byAgent: {
      type: DataTypes.INTEGER
    },
    app_id : {
      type : DataTypes.TEXT
    }, 
    verify_doc :{
      type: DataTypes.BOOLEAN
    },
    totalGrade : {
      type : DataTypes.TEXT
    }, 
    avgGrade : {
      type : DataTypes.TEXT
    },
    degree_Type : {
      type: DataTypes.STRING(100)
    },
    course_name: {
      type: DataTypes.TEXT
    },
  }, {
    sequelize,
    tableName: 'DocumentDetails',
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

  DocumentDetails.setAppId = function(user_id,app_id){
    var query = "UPDATE DocumentDetails SET app_id = " + app_id + " WHERE app_id = null AND user_id = " + user_id;
    return sequelize.query(query, { type: sequelize.QueryTypes.UPDATE});
  }

  DocumentDetails.getDistinctCourse = function(app_id,user_id){
    var query = "SELECT DISTINCT (dd.courseName), pl.duration FROM DocumentDetails as dd ";
    query += " JOIN Program_List as pl ON pl.course_name = dd.courseName ";
    query += " WHERE app_id = " + app_id + " and user_id = " + user_id;
    query += " group by dd.courseName";
    return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
  }
  return DocumentDetails;
};
