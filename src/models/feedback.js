"use strict";

module.exports = function(sequelize, DataTypes) {
  	var _ = require('lodash');
  	var Feedback = sequelize.define("Feedback", {
    	website_satisfy: DataTypes.STRING(20),
	    website_recommend: DataTypes.STRING(20),
    	staff_satisfy: DataTypes.STRING(20),
    	experience_problem : DataTypes.STRING(20),
    	problem: DataTypes.TEXT,
    	suggestion: DataTypes.TEXT,
		source : DataTypes.STRING(50),
 	},{
		sequelize,
		tableName: 'Feedback',
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

	// Feedback.getAllData  = function() {
	// var query = "SELECT DATE_FORMAT(fdb.created_at, '%d/%m/%Y') as feedback_create , usr.email, usr.name as user_name, usr.surname, fdb.website_satisfy, fdb.website_recommend, fdb.staff_satisfy, fdb.experience_problem, fdb.problem, fdb.suggestion,fdb.source from Feedback as fdb Left Join User as usr on usr.id = fdb.user_id ORDER BY fdb.created_at DESC"
	// return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	// };

	Feedback.getAllData = function() {
		return sequelize.query("CALL GetAllFeedbackData()",{
			type: sequelize.QueryTypes.RAW
		}); 
	};

	Feedback.getimporvementFeedback  = function(date) {
		var query = "SELECT usr.email, usr.name, usr.surname FROM Feedback AS fdb ";
		query += " JOIN User AS usr ON usr.id = fdb.user_id "
		query += " WHERE (website_satisfy = 'can_improve' OR staff_satisfy = 'can_improve' OR website_satisfy = 'Unsatisfy' OR staff_satisfy = 'Unsatisfy') AND ";
		query += " fdb.created_at like '%" + date + "%'";
		
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	};

    Feedback.associate = (models) => {
        Feedback.belongsTo(models.User, {foreignKey: 'user_id'});
    };
  //Feedback.belongsTo(sequelize.models.User, {foreignKey: 'user_id'});
  
  return Feedback;
};
