const F = require('./F');
const path = require('path');
const app = new F.Koa();

F.debug(() => require('dotenv').config());

app.use(F.load(path.join(__dirname, './route.config')));
app.on('error', (err, ctx) => {
    console.log('server error', err);
    if (!ctx.__handlederror) {
        ctx.fail(500, 'server error');
    }
});
app.listen(3000);
