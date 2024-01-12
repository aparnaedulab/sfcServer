"use strict";

module.exports = function(sequelize, DataTypes) {
	var Role = sequelize.define("Role", {
		AdminDash: {
	      type: DataTypes.BOOLEAN,
	      allowNull: false,
	      defaultValue: false
	    },
	  
		studentManagement: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        collegeManagement: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        adminTotal: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
         
        adminPending: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        adminVerified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        adminSigned: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
         
        adminPrint: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        adminWesApp: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        adminemailed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        adminPayment: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        adminReport: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
		 
		studentfeedback :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		help :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		},
		source :{
            type: DataTypes.JSON,
            allowNull: true
        },
		university :{
            type: DataTypes.JSON,
            allowNull: true
        },
        fileManagement :{
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
		marksheet :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		transcript :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		degree :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		thesis :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		moi :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		printedulab :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
	}, {

		sequelize,
		tableName: 'Role',
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

	Role.checkSource = function( portal, user_id){
		var query='';
		query += " SELECT JSON_SEARCH(source, 'all', '"+portal+"') as location, JSON_LENGTH(source) as count from role where userid = "+user_id ;
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	};
	
    Role.associate = (models) => {
        Role.belongsTo(models.User, {foreignKey: 'userid'});
    };
	

	return Role;
};