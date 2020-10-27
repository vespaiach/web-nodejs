if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}
const db = require('./addons/db');
const P = require('./lib/Pool');

P.start(3000, { db }).on('fail', (err) => {
    // Todo: handle server error
    console.error(err);
});
