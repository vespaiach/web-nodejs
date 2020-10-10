module.exports = async (ctx, next) => {
    if (ctx.uri.search) {
        ctx.params = ctx.params || {};
        const params = ctx.uri.search.split('&');
        params.reduce((acc, param) => {
            const k = param.split('=');
            acc[k[0].trim()] = k[1].trim();
            return acc;
        }, ctx.params);
    }

    await next();
};
