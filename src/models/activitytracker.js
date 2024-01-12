"use strict";

module.exports = function(sequelize, DataTypes) {


	var Activitytracker = sequelize.define("Activitytracker", {
		user_id: DataTypes.STRING(10),
		activity: DataTypes.STRING(500),
		data: DataTypes.STRING(500),
		application_id: DataTypes.STRING(10),
		source: DataTypes.STRING(50),
		ipAddress:DataTypes.STRING(50),
        location: DataTypes.STRING(50),
        ip_data:DataTypes.STRING(225),
		edulabActivity: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
        },
	},{
		sequelize,
		tableName: 'Activitytracker',
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

	Activitytracker.getsuperactivitySearchResults= function(filters,limit,offset){  
		var where_student_name = '',
     		where_application_email = '',
      		where_source_from = '',
			  where_application_date = '',
      		where_application_data = '';
   		var limitOffset = '';
   		if (filters.length > 0) {
    		filters.forEach(function(filter) {
        		if (filter.name == "name") {
          			where_student_name = filter.value;
        		}  else if (filter.name == "date") {
          			where_application_date = " AND sa.created_at like '%" + filter.value + "%' ";
        		} else if (filter.name == "email") {
          			where_application_email = " AND usr.email like '%" + filter.value  + "%' or sa.data like '%" + filter.value + "%'" ;
        		} else if(filter.name == 'data'){
          			where_application_data ="AND sa.data like '%" + filter.value +"%' ";
        		} else if(filter.name == 'source'){
					where_source_from ="AND sa.source like '%" + filter.value +"%' ";
			  	}
    		});
		}
  		if (limit != null && offset != null) {
    		limitOffset = ' LIMIT ' + limit + ' OFFSET ' + offset;
  		}

		var query = 'SELECT sa.created_at as created_at, usr.email as username, sa.activity as action, sa.data as data, sa.source as source_from,sa.application_id as application_id, ';
		query += ' sa.ipAddress as ipAddress FROM Activitytracker sa ';
  		query += ' JOIN User as usr on usr.id = sa.user_id WHERE 1 = 1 and sa.edulabActivity = 0 ';

  		query += where_application_data;
  		query += where_application_email;
  		query += where_application_date;
		query += where_source_from;
  		query += 'ORDER BY sa.created_at DESC';
  		query += limitOffset;
		return sequelize.query(query, { type: sequelize.QueryTypes.SELECT});
	};



	return Activitytracker;
};

