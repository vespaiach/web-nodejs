const jwt = require('jsonwebtoken');

module.exports = async (ctx, next) => {
    if (!ctx.req.headers.authentication || !ctx.req.headers.authentication.startsWith('Bearer ')) {
        ctx.throw(401, 'token required', { expose: true });
        return;
    }

    ctx.state.rawToken = ctx.req.headers.authentication.slice(7).trim();
    if (!ctx.state.bearerToken.length) {
        ctx.throw(401, 'bad token', { expose: true });
        return;
    }

    try {
        ctx.state.tokenClaims = jwt.verify(ctx.state.bearerToken, process.env.TOKEN_SECRET);
    } catch (err) {
        ctx.throw(401, 'bad token', { expose: true });
        return;
    }

    await next();
};
