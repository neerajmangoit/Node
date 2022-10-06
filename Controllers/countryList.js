const db = require("../Config/database");
const sequelize = require("sequelize");
const database = require("../Config/database");

function myFunc(obj, prop) {
  return obj.reduce(function (acc, item) {
    let key = item[prop];
    if (typeof key === "string") {
      key = key.replace(/\s+/g, "");
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

const getCountryList = async (req, res) => {
  let data = await db;
  data = await data.query(
    `SELECT DISTINCT countries.id AS country_id, name AS country_name, flag_path 
    AS flag, countries.id, iso_code, lat, lng, countries.name 
    AS name, year FROM countries INNER JOIN ndhs_master 
    ON countries.id = ndhs_master.country_id ORDER BY name`,
    (err, rows, fields) => {
      if (!err) {
        res.send(rows);
      } else {
        console.log(err);
      }
    }
  );
  res.send(data[0]);
};

const getComparativeInfo = async (req, res) => {
  let data = await db;

  if (
    req.body.developmentId &&
    req.body.country_id &&
    req.body.ultimateId &&
    req.body.governanceId
  ) {
    var countries = req.body.country_id;
    var sepCon = countries.split(",");
    data = await data.query(
      `SELECT countries.id, countries.name AS country, questions.taxonomy_id, 
      taxonomies.name AS taxonomy, development_types.name AS development_type,ultimate_fields.name
      AS ultimate_field, SUM(score) AS score
      FROM ndhs_master
      INNER JOIN questions ON ndhs_master.question_id = questions.id
      INNER JOIN taxonomies ON questions.taxonomy_id = taxonomies.id
      INNER JOIN ultimate_fields ON questions.ultimate_fields_id = ultimate_fields.id
      INNER JOIN countries ON ndhs_master.country_id = countries.id
      INNER JOIN development_types ON questions.development_types_id = development_types.id
      
      WHERE questions.development_types_id =${req.body.developmentId} and ultimate_fields_id=${req.body.ultimateId}
      and country_id=${sepCon[0]} and governance_id=${req.body.governanceId} or 
      questions.development_types_id =${req.body.developmentId} and 
      ultimate_fields_id=${req.body.ultimateId} and country_id=${sepCon[1]} and governance_id=${req.body.governanceId}
      
      GROUP BY questions.taxonomy_id, countries.id,taxonomies.name, ultimate_fields_id,
  ultimate_fields.name, development_types.name`,
      (err, rows, fields) => {
        if (!err) {
          console.log(rows);
          res.send("fhdskh");
        } else {
          console.log(err);
        }
      }
    );
    data[0].forEach((element) => {
      element.percentage = element.score + ".0000000000000000";
    });
    res.send(data[0]);
  } else {
    res.send("Please provide valid parameters");
  }
};

const getGovernanceStats = async (req, res) => {
  let data = await db;

  let sql = await data.query("SELECT name FROM development_types");

  if (req.params.year && req.params.counrty_id && req.params.governance_id) {
    data = await data.query(
      `SELECT SUM(score) AS score, questions.taxonomy_id, taxonomies.name AS taxonomy_name, 
      development_types.id AS development_id, development_types.name AS development_type, 
      ultimate_fields.id As ultimate_id,ultimate_fields.name AS ultimate_field
      
      FROM ndhs_master
      INNER JOIN questions ON ndhs_master.question_id = questions.id
      INNER JOIN taxonomies ON questions.taxonomy_id = taxonomies.id
      INNER JOIN ultimate_fields ON questions.ultimate_fields_id = ultimate_fields.id
      INNER JOIN countries ON ndhs_master.country_id = countries.id
      INNER JOIN development_types ON questions.development_types_id = development_types.id
      WHERE ndhs_master.year=? and country_id=? and governance_id=?
      
      GROUP BY questions.taxonomy_id, taxonomies.name, ultimate_fields.id,
      ultimate_fields.name, development_types.name, development_types.id`,
      {
        replacements: [
          req.params.year,
          req.params.counrty_id,
          req.params.governance_id,
        ],
      },
      (err, rows, fields) => {
        if (!err) {
          console.log(rows);
          res.send(data);
        } else {
          console.log(err);
        }
      }
    );
  } else {
    res.send("Please enter valid parameters");
  }

  let sortByDevType = myFunc(data[0], "development_type");
  let sortBYGovernanceType = [];

  sql[0].forEach((development) => {
    sortByDevType[development.name.replace(/\s+/g, "")];

    sortBYGovernanceType.push({
      [development.name.replace(/\s+/g, "")]: myFunc(
        sortByDevType[development.name.replace(/\s+/g, "")],
        "taxonomy_name"
      ),
    });
  });
  res.send(sortBYGovernanceType);
};

const getTopCountries = async (req, res) => {
  let data = await db;

  var year = req.body.year;
  var sepYear = year.split(",");

  data = await data.query(
    `SELECT countries.id, countries.name AS countries, questions.taxonomy_id, 
    taxonomies.name AS taxonomy, development_types.name AS development_type,ultimate_fields.name AS ultimate_field,
    SUM(score) AS score
    FROM ndhs_master
    INNER JOIN questions ON ndhs_master.question_id = questions.id
    INNER JOIN taxonomies ON questions.taxonomy_id = taxonomies.id
    INNER JOIN ultimate_fields ON questions.ultimate_fields_id = ultimate_fields.id
    INNER JOIN countries ON ndhs_master.country_id = countries.id
    INNER JOIN development_types ON questions.development_types_id = development_types.id
    
    WHERE questions.development_types_id =${req.body.development_types_id} and 
    ultimate_fields_id=${req.body.ultimate_fields_id} and
    taxonomies.id=${req.body.taxonomy_id} and governance_id=${req.body.governance_id} and ndhs_master.year=${sepYear[0]} OR
    
    questions.development_types_id =${req.body.development_types_id} and 
    ultimate_fields_id=${req.body.ultimate_fields_id} and
    taxonomies.id=${req.body.taxonomy_id} and governance_id=${req.body.governance_id} and ndhs_master.year=${sepYear[1]}
    
    GROUP BY questions.taxonomy_id, countries.id,taxonomies.name, ultimate_fields_id,
    ultimate_fields.name, development_types.name
    
    ORDER BY score DESC LIMIT 5`,
    (err, rows, fields) => {
      if (!err) {
        console.log(rows);
        res.send(data);
      } else {
        console.log(err);
      }
    }
  );
  res.send(data[0]);
};

const getStatsGraph = async (req, res) => {
  let data = await db;

  var countries = req.body.countries;
  var sepCon = countries.split(",");

  data = await data.query(
    `SELECT questions.development_types_id ,countries.id AS country_id, countries.name AS country_name, 
    questions.taxonomy_id AS taxonomy_id, taxonomies.name AS taxonomy, countries.iso_code, 
    governance_types.id AS governance_id, governance_types.name AS governance_name,
    development_types.name AS development_type, ultimate_fields.id AS ultimate_id , 
    ultimate_fields.name AS ultimate_field, 
    SUM(score) AS actual_score, taxonomies.taxonomy_score AS total
    FROM ndhs_master
    INNER JOIN questions ON ndhs_master.question_id = questions.id
    INNER JOIN taxonomies ON questions.taxonomy_id = taxonomies.id
    INNER JOIN ultimate_fields ON questions.ultimate_fields_id = ultimate_fields.id
    INNER JOIN countries ON ndhs_master.country_id = countries.id
    INNER JOIN development_types ON questions.development_types_id = development_types.id
    INNER JOIN governance_types ON taxonomies.governance_id = governance_types.id
    
    WHERE questions.development_types_id =${req.body.development_types_id} and 
    ultimate_fields_id=${req.body.ultimate_fields_id} and
    taxonomies.id=${req.body.taxonomy_id} and taxonomies.governance_id=${req.body.governance_id}
    and countries.id=${sepCon[0]} OR
    
    questions.development_types_id =${req.body.development_types_id} and 
    ultimate_fields_id=${req.body.ultimate_fields_id} and
    taxonomies.id=${req.body.taxonomy_id} and taxonomies.governance_id=${req.body.governance_id}
    and countries.id=${sepCon[1]}
    
    GROUP BY questions.taxonomy_id, countries.id,taxonomies.name, ultimate_fields_id,
    ultimate_fields.name, development_types.name, questions.development_types_id,
    taxonomies.taxonomy_score, ultimate_fields.id, governance_types.id`,
    (err, rows, fields) => {
      if (!err) {
        console.log(rows);
        res.send(data);
      } else {
        console.log(err);
      }
    }
  );
  res.send(data[0]);
};

const getStatsTable = async (req, res) => {
  let data = await db;

  var countries = req.body.countries;
  var sepCon = countries.split(",");

  data = await data.query(
    `SELECT questions.development_types_id ,countries.id AS country_id, countries.name AS country_name, 
    questions.taxonomy_id AS taxonomy_id, taxonomies.name AS taxonomy,
    development_types.name AS development_type, ultimate_fields.id AS ultimate_id , ultimate_fields.name AS ultimate_field,
    questions.indicator_id AS indicator_id, indicators.name AS indicator_name, questions.indicator_score,
    question_master.name AS question, questions.question_score AS question_score, score AS actual_score ,status
    FROM ndhs_master
    INNER JOIN questions ON ndhs_master.question_id = questions.id
    INNER JOIN taxonomies ON questions.taxonomy_id = taxonomies.id
    INNER JOIN ultimate_fields ON questions.ultimate_fields_id = ultimate_fields.id
    INNER JOIN countries ON ndhs_master.country_id = countries.id
    INNER JOIN development_types ON questions.development_types_id = development_types.id
    INNER JOIN indicators ON questions.indicator_id = indicators.id
    INNER JOIN question_master ON questions.question_id = question_master.id
    
    WHERE questions.development_types_id =${req.body.development_types_id} and 
    ultimate_fields_id=${req.body.ultimate_fields_id} and
    taxonomies.id=${req.body.taxonomy_id} and taxonomies.governance_id=${req.body.governance_id}
    and countries.id=${sepCon[0]} OR
    
    questions.development_types_id =${req.body.development_types_id} and 
    ultimate_fields_id=${req.body.ultimate_fields_id} and
    taxonomies.id=${req.body.taxonomy_id} and taxonomies.governance_id=${req.body.governance_id}
    and countries.id=${sepCon[1]}
    
    GROUP BY questions.taxonomy_id, countries.id,taxonomies.name, ultimate_fields_id,
ultimate_fields.name, development_types.name, questions.development_types_id, 
ultimate_fields.id, questions.question_score, indicators.id, question_master.name, score 
,status, questions.indicator_id ,questions.indicator_score`,
    (err, rows, fields) => {
      if (!err) {
        console.log(rows);
        res.send(data);
      } else {
        console.log(err);
      }
    }
  );
  res.send(data[0]);
};

const getOverview = async (req, res) => {
  let data = await db;

  data = await data.query(
    `SELECT score AS actual_score, country_id, countries.name AS country_name, questions.development_types_id AS developement_id, 
    development_types.name AS development_name, questions.indicator_id, indicators.name AS indicator_name, 
    questions.indicator_score, question_master.name AS question, questions.question_id,
    questions.question_score, status, questions.taxonomy_id, taxonomies.name AS taxonomy_name, 
    questions.ultimate_fields_id, ultimate_fields.name AS ultimate_name
    
    FROM ndhs_master
    INNER JOIN questions ON ndhs_master.question_id = questions.id
    INNER JOIN taxonomies ON questions.taxonomy_id = taxonomies.id
    INNER JOIN ultimate_fields ON questions.ultimate_fields_id = ultimate_fields.id
    INNER JOIN countries ON ndhs_master.country_id = countries.id
    INNER JOIN development_types ON questions.development_types_id = development_types.id
    INNER JOIN indicators ON questions.indicator_id = indicators.id
    INNER JOIN question_master ON questions.question_id = question_master.id
    
    WHERE taxonomies.governance_id=${req.body.governance_id} and countries.id=${req.body.country_id}
    
    GROUP BY questions.taxonomy_id, countries.id,taxonomies.name, ultimate_fields_id,
    ultimate_fields.name, development_types.name, questions.development_types_id, 
    ultimate_fields.id, questions.question_score, indicators.id, question_master.name, score 
    ,status, questions.indicator_id ,questions.indicator_score, country_id, questions.question_id
    
    ORDER BY questions.development_types_id, questions.ultimate_fields_id, questions.taxonomy_id,
    questions.indicator_id`,
    (err, rows, fields) => {
      if (!err) {
        console.log(rows);
        res.send(data);
      } else {
        console.log(err);
      }
    }
  );
  let result = [];
  let sortByDevType = myFunc(data[0], "development_name");
  Object.keys(sortByDevType).forEach((devType) => {
    let sortByUltimateType = myFunc(sortByDevType[devType], "ultimate_name");
    Object.keys(sortByUltimateType).forEach((ultimateType) => {
      let sortByTaxonomyType = myFunc(
        sortByUltimateType[ultimateType],
        "taxonomy_name"
      );
      Object.keys(sortByTaxonomyType).forEach((taxonomyType) => {
        let sortByIndicator = myFunc(
          sortByTaxonomyType[taxonomyType],
          "indicator_name"
        );
        result.push({
          [devType]: {
            [ultimateType]: {
              [taxonomyType]: sortByIndicator,
            },
          },
        });
      });
    });
  });

  res.send(result);
};

const getComapative = async (req, res) => {
  let data = await db;

  var countries = req.body.country_id;
  var sepCon = countries.split(",");

  var governanceId = req.body.governance_id;
  var sepGov = governanceId.split(",");

  let subQuery = await data.query(
    `SELECT governance_id,SUM(taxonomy_score)  AS total FROM taxonomies GROUP BY governance_id`
  );

  data = await data.query(
    `SELECT SUM(score), year, taxonomies.governance_id, governance_types.name AS governance_name, questions.development_types_id, 
      development_types.name AS development_type, questions.ultimate_fields_id, 
      ultimate_fields.name AS ultimate_field, countries.name AS country 
      FROM ndhs_master
      INNER JOIN questions ON ndhs_master.question_id = questions.id
      INNER JOIN taxonomies ON questions.taxonomy_id = taxonomies.id
      INNER JOIN governance_types ON taxonomies.governance_id = governance_types.id
      INNER JOIN ultimate_fields ON questions.ultimate_fields_id = ultimate_fields.id
      INNER JOIN countries ON ndhs_master.country_id = countries.id
      INNER JOIN development_types ON questions.development_types_id = development_types.id
      
      WHERE countries.id=${sepCon[0]} OR countries.id=${sepCon[1]} 
      
      GROUP BY  questions.development_types_id, year, taxonomies.governance_id, governance_types.name,
      development_types.name, questions.ultimate_fields_id, ultimate_fields.name, countries.name, taxonomies.taxonomy_score`,
    (err, rows, fields) => {
      if (!err) {
        console.log(rows);
        res.send(data);
      } else {
        console.log(err);
      }
    }
  );

  data[0].forEach((element) => {
    if (element.governance_id == subQuery[0][0].governance_id) {
      element.total = subQuery[0][0].total;
    } else {
      element.total = subQuery[0][1].total;
    }
  });

  res.send(data[0]);
};

const testing = async (req, res) => {
  country = req.params.country;
  let data = await db;
  let sql = `SELECT score, taxonomy_id, taxonomies.name AS taxonomy_name, ultimate_fields_id, 
    development_types_id FROM questions INNER JOIN taxonomies 
    ON questions.taxonomy_id = taxonomies.id INNER JOIN ndhs_master 
    ON ndhs_master.question_id = questions.question_id WHERE development_types_id =1
     and governance_id =1 and ultimate_fields_id=1 and country_id = ?`;
  data = await sequelize.query(sql, country, (err, rows, fields) => {
    if (!err) {
      res.send(rows[0]);
    } else {
      console.log(err);
    }
  });
};

module.exports = {
  getCountryList,
  getComparativeInfo,
  getGovernanceStats,
  getTopCountries,
  getStatsGraph,
  getStatsTable,
  getOverview,
  getComapative,
  testing,
};

