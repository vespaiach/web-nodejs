exports.ping = async function (ctx) {
    ctx.text(200, { data: ctx.params.id });
};
