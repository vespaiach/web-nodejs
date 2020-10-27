const R = (module.exports = exports = {});

R.register = async (liquid) => {
    liquid.ok(200, { yes: true });
};

R.verifySms = async (ctx) => {
    ctx.json(200, ctx.payload);
};
