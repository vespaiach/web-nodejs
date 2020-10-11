const allowOrigins = (process.env.CORS_ALLOW_ORIGINS || '').split(',');

module.exports = async (liquid, next) => {
    const requestOrigin = liquid.request.headers['origin'];

    if (requestOrigin) {
        allowOrigins.some((o) => o === requestOrigin) &&
            liquid.response.setHeader('Access-Control-Allow-Origin', requestOrigin);
    }

    try {
        await next();
    } catch (err) {
        liquid.report(err);
        liquid.fail(500, 'Unexpected server error');
    }

    liquid.response.setHeader('Vary', 'Origin');
};
