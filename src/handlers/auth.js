const jwt = require('jsonwebtoken');

module.exports = async (ctx, next) => {
    if (
        !ctx.request.headers.authentication ||
        !ctx.request.headers.authentication.startsWith('Bearer ')
    ) {
        ctx.throw(401);
    }

    ctx.rawToken = ctx.req.headers.authentication.slice(7).trim();
    if (!ctx.state.bearerToken.length) {
        ctx.throw(401, 'Bad Token');
    }

    try {
        ctx.tokenClaims = jwt.verify(ctx.bearerToken, process.env.TOKEN_SECRET);
    } catch (err) {
        ctx.throw(401, 'Bad Token');
    }

    await next();
};
