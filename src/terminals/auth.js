const jwt = require('jsonwebtoken');

module.exports = async (liquid, next) => {
    const authentication = liquid.request.headers['authentication'];
    if (!authentication) {
        liquid.fail(401);
        return;
    }

    if (!authentication.startsWith('Bearer ')) {
        liquid.fail(401, 'Bad authentication token');
        return;
    }

    liquid.rawToken = authentication.slice(7).trim();

    if (!liquid.rawToken.length) {
        liquid.fail(401, 'Bad Token');
        return;
    }

    try {
        liquid.tokenClaims = jwt.verify(liquid.rawToken, process.env.TOKEN_SECRET);
    } catch (err) {
        liquid.fail(401, 'Bad Token');
        return;
    }

    await next();
};
