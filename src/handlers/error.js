module.exports = async (ctx, next) => {
    ctx.on('error', (err) => {
        ctx.json(err.statusCode, ...err.toJson());
    });

    await next();
};
