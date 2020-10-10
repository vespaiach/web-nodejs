const allowOrigins = (process.env.CORS_ALLOW_ORIGINS || '').split(',');
const allowMethods = (process.env.CORS_ALLOW_METHODS || 'POST').split(',');
const allowHeaders = (process.env.CORS_ALLOW_HEADERS || 'Content-Type').split(',');
const maxAge = process.env.CORS_MAX_AGE || '86400';

module.exports = async (ctx, next) => {
    const requestOrigin = ctx.request.headers['Origin'];

    if (requestOrigin) {
        allowOrigins.some((o) => o === requestOrigin) &&
            ctx.response.setHeader('Access-Control-Allow-Origin', requestOrigin);
    }

    if (ctx.request.method === 'OPTIONS') {
        if (!ctx.request.headers['Access-Control-Request-Method']) {
            return await next();
        }
        ctx.response.setHeader('Access-Control-Allow-Methods', allowMethods.join(','));

        if (ctx.get('Access-Control-Request-Headers')) {
            ctx.response.setHeader('Access-Control-Allow-Headers', allowHeaders);
        }

        ctx.response.setHeader('Access-Control-Max-Age', maxAge);
        ctx.response.setHeader('Vary', 'Origin', 'Content-Type');

        ctx.ok204();
        return;
    }

    ctx.response.setHeader('Vary', 'Origin');
    await next();
};
