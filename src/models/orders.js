"use strict";

module.exports = function(sequelize, DataTypes) {
	var Orders = sequelize.define("Orders", {
		order_id :DataTypes.STRING(50),
		user_id: DataTypes.INTEGER(10),
		application_id: DataTypes.INTEGER(10),
		timestamp: DataTypes.DATE,
		timestamp_payment: DataTypes.DATE,
		amount: DataTypes.DECIMAL(10,2),
		status: {
			type: DataTypes.ENUM('-1', '0','1','2','3','4','5'),
			allowNull: false,
			defaultValue: '0'
	    },
		recurring: {
			type: DataTypes.ENUM('YES', 'NO'),
			allowNull: true,
			defaultValue: null
	    },
		timeduration :DataTypes.STRING(35),
		challan_no : DataTypes.TEXT,
		split : DataTypes.BOOLEAN,
		source : DataTypes.STRING(100)
	}, {

		sequelize,
		tableName: 'Orders',
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

    Orders.getThreeDigit = function(yesterday,today){
		var query='';
			query += " SELECT max( id ) as MAXID FROM `Orders` ";
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	};

	return Orders;
};	