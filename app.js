const express = require('express');
const bodyParser = require('body-parser');
const db = require('./Config/database');
const app = express();
const router = require('./Routes/routes');
const countryController = require('./Controllers/countryList');
const sequelize = require('sequelize');
app.use(bodyParser.json());


// routes
app.get('/', (req, res) => res.send("HOME"));

app.get('/ndhs-master/country-list', countryController.getCountryList);

app.post('/ndhs-master/comparative-information', countryController.getComparativeInfo);

app.get('/ndhs-master/:year/:counrty_id/:governance_id', countryController.getGovernanceStats);

app.post('/ndhs-master/top-countries', countryController.getTopCountries);

app.post('/ndhs-master/stats-graph', countryController.getStatsGraph);

app.post('/ndhs-master/stats-table', countryController.getStatsTable);

app.post('/ndhs-master/overview', countryController.getOverview);

app.post('/ndhs-master/comparative', countryController.getComapative);

app.get('/testing/:country', countryController.testing);


db.authenticate().then(() => {
    console.log("Database connected.....");
}).catch(err => {
    console.log("Error connecting" + err);
});


const PORT = process.env.PORT || 2000;

app.listen(PORT, console.log(`application running on port ${PORT}`)); //