if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

const path = require('path');
const { Pool } = require('http-engine');
const db = require('./addons/db');

const teminalPath = path.join(__dirname, 'terminals');
const pipelinePath = path.join(__dirname, 'pipeline.config');

Pool.start(3000, teminalPath, pipelinePath, { db }).on('fail', (err) => {
    // Todo: handle server error
    console.error(err);
});
