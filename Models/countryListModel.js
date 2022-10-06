const { DataTypes } = require('sequelize');
const sequelize = require('../Models/');

const ListModel = sequelize.define('LModel', {
    id: { type: DataTypes.STRING },
    year: { type: DataTypes },
    name: { type: DataTypes.STRING },
    iso_code: { type: DataTypes.STRING },
    lat: { type: DataTypes.STRING },
    lng: { type: DataTypes.STRING },
    flag_path: { type: DataTypes.STRING }
}, {
    tableNAme: 'countries'
})

module.exports = ListModel;