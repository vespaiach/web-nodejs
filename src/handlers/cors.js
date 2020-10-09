const allowOrigins = (process.env.CORS_ALLOW_ORIGINS || '').split(',');
const allowMethods = (process.env.CORS_ALLOW_METHODS || 'POST').split(',');
const allowHeaders = (process.env.CORS_ALLOW_HEADERS || 'Content-Type').split(',');
const maxAge = process.env.CORS_MAX_AGE || '86400';

module.exports = async (ctx, next) => {
    const requestOrigin = ctx.get('Origin');

    if (requestOrigin) {
        allowOrigins.some((o) => o === requestOrigin) &&
            ctx.set('Access-Control-Allow-Origin', requestOrigin);
    }

    if (ctx.method === 'OPTIONS') {
        if (!ctx.get('Access-Control-Request-Method')) {
            return await next();
        }
        ctx.set('Access-Control-Allow-Methods', allowMethods.join(','));

        if (ctx.get('Access-Control-Request-Headers')) {
            ctx.set('Access-Control-Allow-Headers', allowHeaders);
        }

        ctx.set('Access-Control-Max-Age', maxAge);
        ctx.vary('Origin', 'Content-Type');

        ctx.status = 204;
        return;
    }

    ctx.vary('Origin');
    await next();
};
