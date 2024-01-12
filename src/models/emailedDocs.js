"use strict";

module.exports = function(sequelize, DataTypes) {
    var EmailedDocs = sequelize.define("Emailed_Docs",{
      
        filename : DataTypes.TEXT,
        doc_type : DataTypes.TEXT,
        password : DataTypes.STRING(11),
        opened_loc : DataTypes.STRING(100),
        ip_address :  DataTypes.STRING(50),
        category : DataTypes.TEXT,
        sengrid_msg_id : DataTypes.TEXT,
	    marklist_id :  DataTypes.TEXT,
        gradToPer_id :  DataTypes.TEXT,
        competency_id :  DataTypes.TEXT,
        namechange_id :  DataTypes.TEXT,
    },{
        sequelize,
        tableName: 'Emailed_Docs',
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

    EmailedDocs.associate = (models) => {
        EmailedDocs.belongsTo(models.User_Transcript, {foreignKey: 'transcript_id'});
        EmailedDocs.belongsTo(models.Application, {foreignKey: 'app_id'});
        EmailedDocs.belongsTo(models.User_Curriculum, {foreignKey: 'curriculum_id'});

    };
     
    return EmailedDocs;
}