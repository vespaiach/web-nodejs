const R = (module.exports = exports = {});

R.sendSms = async (ctx) => {
    ctx.ok(200, ctx.payload);
};

R.verifySms = async (ctx) => {
    ctx.ok(200, ctx.payload);
};
