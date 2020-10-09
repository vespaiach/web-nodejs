module.exports = async (ctx, next) => {
    ctx.on('error', (err) => {
        console.error(err);
        ctx.json(err.statusCode, { errors: [err.message] });
    });
    await next();
};
