const http = require('http');
const fs = require('fs');
const rl = require('readline');
const path = require('path');
const { EventEmitter } = require('events');

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
    fs.readdirSync(path.join(__dirname, 'handlers')).forEach((file) => {
        const handler = require(`./handlers/${file}`);
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
    const reg = /^(get|post|put|delete)\s(\/[^\s]*)\s(.+)$/i;
    rl.createInterface(
        fs.createReadStream(path.join(__dirname, 'route.config'), { encoding: 'utf-8' })
    ).on('line', (line) => {
        if (!reg.test(line)) {
            throw new Error(`Wrong syntax: ${line}`);
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
    const match = (this.routes[ctx.request.method.toLowerCase()] || []).find((p) =>
        p[0].test(ctx.request.url)
    );
    if (!match) {
        ctx.throw(404, 'no route found');
        return;
    }

    await this.compose(match[1])(ctx);
};

function json(statusCode, ...rest) {
    this.response.statusCode = statusCode;
    const body = JSON.stringify({ ...rest });
    this.response.setHeader('Content-Type', 'application/json');
    this.response.setHeader('Content-Length', Buffer.byteLength(body));
    this.response.end(body);
}

function json204() {
    this.response.statusCode = 204;
    this.response.removeHeader('Content-Type');
    this.response.removeHeader('Transfer-Encoding');
    return this.response.end();
}

function createHttpError(statusCode, message, options) {
    return {
        statusCode,
        message,
        ...options,
    };
}

F.createContext = function (request, response) {
    const ctx = Object.create(new EventEmitter());
    ctx.json = json;
    ctx.json204 = json204;
    ctx.request = request;
    ctx.response = response;
    ctx.createHttpError = createHttpError;
    return ctx;
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

F.createServer = function (port = 3000) {
    loadHandlers.call(this);
    readRouteConfig.call(this);

    const server = http.createServer(async (request, response) => {
        const ctx = this.createContext(request, response);

        request.on('error', (err) => {
            ctx.emit('error', ctx.createHttpError(500, 'Request stream error', { origin: err }));
        });
        response.on('error', (err) => {
            ctx.emit('error', ctx.createHttpError(500, 'Response stream error', { origin: err }));
        });

        await this.routing(ctx);
    });

    server.listen(port);
    console.log(`App is running at port: ${port}`);

    return server;
};
