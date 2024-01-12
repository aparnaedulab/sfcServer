"use strict";

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("Transaction", {
		order_id: DataTypes.STRING(45),
		tracking_id: DataTypes.STRING(45),
		bank_ref_no: DataTypes.STRING(45),
		order_status: DataTypes.STRING(45),
		failure_message: DataTypes.STRING(45),
		payment_mode : DataTypes.STRING(45),
		card_name : DataTypes.STRING(45),
		status_code : DataTypes.STRING(45),
		status_message : DataTypes.STRING(45),
		currency: DataTypes.STRING(45),
		amount: DataTypes.STRING(45),
		billing_name: DataTypes.STRING(90),
		billing_address: DataTypes.STRING(90),
		billing_city: DataTypes.STRING(90),
		billing_state: DataTypes.STRING(45),
		billing_zip: DataTypes.STRING(9),
		billing_country: DataTypes.STRING(45),
		billing_tel: DataTypes.STRING(45),
		billing_email: DataTypes.STRING(90),
		delivery_name: DataTypes.STRING(45),
		delivery_address: DataTypes.STRING(45),
		delivery_city: DataTypes.STRING(45),
		delivery_state: DataTypes.STRING(45),
		delivery_zip: DataTypes.STRING(45),
		delivery_country: DataTypes.STRING(45),
		delivery_tel: DataTypes.STRING(45),
		merchant_param1: DataTypes.STRING(90),
		merchant_param2: DataTypes.STRING(90),
		merchant_param3: DataTypes.STRING(90),
		merchant_param4: DataTypes.STRING(90),
		merchant_param5: DataTypes.STRING(90),
		a: DataTypes.TEXT,
		b: DataTypes.TEXT,
		college_share: DataTypes.TEXT,
		split_status: DataTypes.ENUM('1','-1'),
		vault : DataTypes.STRING(45),
		mer_amount: DataTypes.STRING(45),
		offer_type : DataTypes.STRING(45),
		offer_code : DataTypes.STRING(45),
		discount_value : DataTypes.STRING(45),
		eci_value : DataTypes.STRING(45),
		retry : DataTypes.STRING(45),
		response_code : DataTypes.STRING(45),
		edulab_refund: DataTypes.TEXT,
        university_refund: DataTypes.TEXT,
        college_refund: DataTypes.TEXT,
        cc_refund: DataTypes.TEXT,
        refund_status: DataTypes.ENUM('0','1','-1'),
		cc_refund_refer : DataTypes.TEXT,
		cc_share : DataTypes.TEXT,
		change_split_payout_status : DataTypes.ENUM('1','-1'),
		cc_call : DataTypes.TEXT
	}, {

		sequelize,
		tableName: 'Transaction',
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
};