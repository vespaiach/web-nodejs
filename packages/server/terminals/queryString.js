module.exports = async (liquid, next) => {
    if (liquid.uri.search) {
        liquid.params = liquid.params || {};
        liquid.uri.search.split('&').forEach((param) => {
            const k = param.split('=');
            liquid.params[k[0].trim()] = k[1].trim();
        });
    }

    await next();
};
