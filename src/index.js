if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

const F = require('./lib/F');
F.createServer().on('error', (err) => {
    console.error(err);
});
