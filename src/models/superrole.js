"use strict";

module.exports = function(sequelize, DataTypes) {
	var Super_Role = sequelize.define("Super_Role", {
		superDashboard: {
	      type: DataTypes.BOOLEAN,
	      allowNull: false,
	      defaultValue: false
	    },
	  
		superStudentManagement: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        supercollegeManagement: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        supertotalapplication: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
         
        superPending: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        superVerified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        superSigned: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
         
        superPrint: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        superWesApp: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },

        superSent: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        superPayment: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
        
        superReport: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
		 
		superfeedback :  {
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
        activity : {
            type:   DataTypes.ENUM,
            values: ['activate', 'deactivate'],
            defaultValue: null,
            allowNull: true
        },
        superrolemanagement :  {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		superFileManagement :{
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
	},
	{

		sequelize,
		tableName: 'Super_Role',
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
	
   	Super_Role.associate = (models) => {
        Super_Role.belongsTo(models.User, {foreignKey: 'userid'});
    };

	return Super_Role;
};