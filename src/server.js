if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

const P = require('./lib/Pool');
P.start().on('fail', (err) => {
    // Todo: handle server error
    console.error(err);
});
