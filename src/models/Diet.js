const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {  
    sequelize.define('diet', {
    
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true},

        description:{
            type:DataTypes.TEXT,
            allowNull: true,

        }
        

        
    },{timestamps: false});
}