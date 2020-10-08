module.exports = (err, ctx) => {
    console.log('server error', err);
    if (!ctx.__handlederror) {
        ctx.fail(500, 'server error');
    }
};
