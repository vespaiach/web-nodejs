const R = (module.exports = exports = {});

R.sendSms = async (ctx) => {
    ctx.json(200, ctx.payload);
};

R.verifySms = async (ctx) => {
    ctx.json(200, ctx.payload);
};
