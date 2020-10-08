if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

const F = require('./F');
const path = require('path');
const app = F.createApplication(process.env.PORT);

app.use(F.middlewares.cors);
app.use(F.createRouter(path.join(__dirname, './route.config')));
app.on('error', F.middlewares.errorHandler);
