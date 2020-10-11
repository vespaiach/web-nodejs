const allowOrigins = (process.env.CORS_ALLOW_ORIGINS || '').split(',');
const allowMethods = (process.env.CORS_ALLOW_METHODS || 'POST').split(',');
const allowHeaders = (process.env.CORS_ALLOW_HEADERS || 'Content-Type').split(',');
const maxAge = process.env.CORS_MAX_AGE || '86400';

module.exports = async (liquid, next) => {
    const requestOrigin = liquid.request.headers['origin'];

    if (requestOrigin) {
        allowOrigins.some((o) => o === requestOrigin) &&
            liquid.response.setHeader('Access-Control-Allow-Origin', requestOrigin);
    }

    if (!liquid.request.headers['access-control-request-method']) {
        return await next();
    }
    liquid.response.setHeader('Access-Control-Allow-Methods', allowMethods.join(','));

    if (liquid.request['access-control-qequest-headers']) {
        liquid.response.setHeader('Access-Control-Allow-Headers', allowHeaders);
    }

    liquid.response.setHeader('Access-Control-Max-Age', maxAge);
    liquid.response.setHeader('Vary', 'Origin', 'Content-Type');

    liquid.done204();
};
