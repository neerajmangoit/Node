const { response } = require('express');
const express = require('express');
const db = require('../Config/database');

const router = express.Router();

router.get('/country-list', (req, res)=> {
    db.query('SELECT DISTINCT countries.id, year, name, iso_code, lat, lng, flag_path FROM countries INNER JOIN ndhs_master ON countries.id = ndhs_master.country_id ORDER BY name',(err, result)=> {
        res.send(result);
    })
});

// router.get('/testing', (req, res)=> {
//     res.send("done");
// });

module.exports = router;