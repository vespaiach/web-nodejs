module.exports = exports = {};
exports.login = async (ctx) => {
    ctx.ok(200, 'hello me');
};
exports.me = async (ctx) => {
    ctx.body = 'me';
};
