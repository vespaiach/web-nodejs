const http = require('http');
const fs = require('fs');
const rl = require('readline');
const path = require('path');
const Context = require('./Context');

const F = (module.exports = { handlers: {}, routes: {} });

['get', 'post', 'put', 'delete'].forEach((method) => {
    /**
     *
     * Add route. Each route will be an array with first element is a regular expression
     * and the rest will be handler functions which will be called in order
     *
     * Example:
     * {
     *      get: [
     *              [/me/i, func1, func2, func3],
     *              [/login/i, func1, func2],
     *      ],
     *      post: [
     *              [/user/create/i, func1, func2],
     *              [/user/update/i, func1, func2],
     *      ],
     * }
     *
     * @param {*} routeRegularExp route regular expression
     * @param {*} handlerNameList array of handler name
     */
    F[method] = function (routeRegularExp, handlerNameList) {
        const handlerList = [];
        if (!routeRegularExp || !handlerNameList || !Array.isArray(handlerNameList)) {
            throw new Error('Wrong parameters');
        }

        for (let fn of handlerNameList) {
            if (!this.handlers[fn]) {
                throw new Error(`No handlers name "${fn}" was found!`);
            }
            handlerList.push(this.handlers[fn]);
        }

        F.routes[method] = F.routes[method] || [];
        F.routes[method].push([new RegExp(routeRegularExp, 'i'), handlerList]);
    };
});

/**
 * Read and load all handlers in handlers folder automatically.
 * If file contains many handlers, its file name will be used as namespace.
 * Example: user.js -> user.login, user.logout, user.create
 */
function loadHandlers() {
    fs.readdirSync(path.join(__dirname, '..', 'handlers')).forEach((file) => {
        const handler = require(`../handlers/${file}`);
        const handlerName = file.replace(/^(.+)\.\w+$/, '$1');

        switch (typeof handler) {
            case 'function':
                this.handlers[handlerName] = handler;
                break;
            case 'object':
                Object.entries(handler).forEach(([k, v]) => {
                    this.handlers[`${handlerName}.${k}`] = v;
                });
                break;
            default:
                break;
        }
    });
}

/**
 * Read route configuration file and build a dictionary of routes.
 *
 */
function readRouteConfig() {
    const reg = /^(get|post|put|delete)\s([^\s]+)\s([^\s]+)$/i;
    rl.createInterface(
        fs.createReadStream(path.join(__dirname, '..', 'route.config'), { encoding: 'utf-8' })
    ).on('line', (line) => {
        if (!reg.test(line)) {
            console.log(`Warn route config: ${line}`);
            return;
        }

        const matches = reg.exec(line.trim());
        this[matches[1]](matches[2], matches[3].split('->'));
    });
}

/**
 * Make middleware array to be called in a chain.
 * Source: https://github.com/koajs/compose
 * @param {Array} handlers list of handlers
 */
F.compose = function (handlers) {
    return function dispatch(context) {
        let lastIndex = -1;
        function dispatch(i) {
            if (i < lastIndex) {
                return Promise.reject();
            }
            lastIndex = i;
            let fn = handlers[i];
            if (!fn) {
                return Promise.resolve();
            }
            try {
                return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
            } catch (e) {
                return Promise.reject(e);
            }
        }
        dispatch(0);
    };
};

F.routing = async function (ctx) {
    if (ctx.isStaticFile) {
        ctx.throw(404);
    }

    const routes = this.routes[ctx.request.method.toLowerCase()] || [];
    let match;
    for (let r of routes) {
        match = r.exec(ctx.uri.pathname);
        if (!match) {
            break;
        }
    }

    if (!match) {
        ctx.throw(404);
    }

    if (match.groups) {
        ctx.params = { ...match.groups };
    }

    await this.compose(match[1])(ctx);
};

F.createServer = function (port = 3000) {
    loadHandlers.call(this);
    readRouteConfig.call(this);

    const server = http.createServer(async (request, response) => {
        const ctx = new Context(request, response);

        request.on('error', (err) => {
            ctx.emit('error', ctx.createHttpError(500, 'Request stream error', { origin: err }));
        });
        response.on('error', (err) => {
            ctx.emit('error', ctx.createHttpError(500, 'Response stream error', { origin: err }));
        });

        try {
            await this.routing(ctx);
        } catch (err) {
            ctx.alertError(err);
        }
    });

    server.listen(port);
    console.log(`App is running at port: ${port}`);

    return server;
};
