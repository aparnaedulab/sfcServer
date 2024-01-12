"use strict";

module.exports = function(sequelize, DataTypes) {
    var VerificationLetters = sequelize.define("VerificationLetters",{
      
        file_name : DataTypes.TEXT,
        doc_type : DataTypes.TEXT,
        user_id: {
            type: DataTypes.INTEGER,
        },
        app_id: {
            type: DataTypes.INTEGER,
        },
        noOfCopies : DataTypes.INTEGER
    },{
        sequelize,
        tableName: 'VerificationLetters',
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

     
    return VerificationLetters;
}