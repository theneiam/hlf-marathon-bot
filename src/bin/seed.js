require('dotenv/config');

const fs = require('fs');
const csvParser = require('csv-parser');
const Promo = require('../schema');

const promos = [];

fs.createReadStream(`${__dirname}/promo.csv`)
  .pipe(csvParser())
  .on('data', ({ code }) => {
    promos.push({ code });
  })
  .on('end', () => {
    Promo.insertMany(promos);
  });
