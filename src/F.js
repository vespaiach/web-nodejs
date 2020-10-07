const Koa = require('koa');
const compose = require('koa-compose');
const fs = require('fs');
const rl = require('readline');

const F = (module.exports = { routes: {} });
const middlewares = {};

fs.readdirSync(require('path').join(__dirname, 'middlewares')).forEach((file) => {
    const mw = require(`./middlewares/${file}`);
    const mwName = file.replace(/^(.+)\.\w+$/, '$1');

    switch (typeof mw) {
        case 'function':
            middlewares[mwName] = mw;
            break;

        case 'object':
            Object.entries(mw).forEach(([k, v]) => {
                middlewares[`${mwName}.${k}`] = v;
            });
            break;
        default:
            break;
    }
});

['get', 'post', 'put', 'delete'].forEach(function (method) {
    F[method] = function () {
        const lst = [];
        const args = Array.prototype.slice.call(arguments);
        if (args.length !== 2) {
            throw new Error('Wrong input parameters for pipe');
        }

        for (let fn of ['error', ...args[1]]) {
            if (!middlewares[fn]) {
                throw new Error(`No middleware name "${fn}" was found!`);
            }
            lst.push(middlewares[fn]);
        }

        this.routes[method] = this.routes[method] || [];
        this.routes[method].push([new RegExp(args[0], 'gi'), lst]);
    };
});

F.dispatch = async function (ctx, next) {
    await next();

    const match = (this.routes[ctx.request.method.toLowerCase()] || []).find((p) =>
        p[0].test(ctx.request.url)
    );
    if (!match) {
        ctx.throw(404, 'no route found');
    }

    compose(match[1])(ctx, next);
}.bind(F);

F.load = function (filePath) {
    const reg = /^(get|post|put|delete)\s(\/[^\s]*)\s(.+)$/i;
    rl.createInterface(fs.createReadStream(filePath, { encoding: 'utf-8' })).on('line', (line) => {
        if (!reg.test(line)) {
            throw new Error(`Wrong syntax: ${line}`);
        }

        const matches = reg.exec(line.trim());
        this[matches[1]](matches[2], matches[3].split('->'));
    });

    return F.dispatch;
};

F.debug = function () {
    if (process.env.NODE_ENV === 'development') {
        for (let ar of arguments) {
            if (typeof ar === 'function') {
                ar.call(global);
            } else {
                console.log('----------------Debug Information----------------');
                console.log(ar);
                console.log('-------------------------------------------------');
            }
        }
    }
};

F.Koa = class App extends Koa {
    constructor(options) {
        super(options);
    }

    /**
     * Overriden creating a new context function
     *
     */
    createContext(req, res) {
        const ctx = Koa.prototype.createContext.call(this, req, res);
        ctx.ok = (statusCode, data, ...rest) => {
            ctx.status = statusCode;
            ctx.body = {
                data,
                ...rest,
            };
        };
        ctx.fail = (statusCode, errors, ...rest) => {
            ctx.status = statusCode;
            ctx.body = {
                errors: Array.isArray(errors) ? errors : [errors],
                ...rest,
            };
        };
        return ctx;
    }
};

F.Koa.HttpError = Koa.HttpError;
