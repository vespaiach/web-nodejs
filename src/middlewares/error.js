/*
 * Handle all client-side errors
 * thrown by "ctx.throw"
 */
module.exports = async function (ctx, next) {
    try {
        await next();
    } catch (err) {
        if (err.expose) {
            ctx.fail(ctx.status, err.message);
            ctx.__handlederror = true;
        }

        // Emit error event for global handler
        ctx.app.emit('error', err, ctx);
    }
};
