const http = require('http');
const fs = require('fs');
const rl = require('readline');
const path = require('path');
const Liquid = require('./Liquid');
const { EventEmitter } = require('events');
const Leakage = require('./Leakage');
const makePipeline = require('./pipeline');

const TERMINALS = {};
const PIPELINES = {};
const Pool = Object.create(new EventEmitter());

module.exports = exports = Pool;

['get', 'post', 'put', 'delete', 'options'].forEach((method) => {
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
     * @param {*} pipelineRegex route regular expression
     * @param {*} pipelineTerminals array of terminal name
     */
    Pool[method] = function (pipelineRegex, pipelineTerminals) {
        const lst = [];
        if (!pipelineRegex || !pipelineTerminals || !Array.isArray(pipelineTerminals)) {
            throw new Error('Wrong parameters');
        }

        for (let fn of pipelineTerminals) {
            if (!TERMINALS[fn]) {
                throw new Error(`No terminal name "${fn}" was found!`);
            }
            lst.push(TERMINALS[fn]);
        }

        PIPELINES[method] = PIPELINES[method] || [];
        PIPELINES[method].push([new RegExp(pipelineRegex, 'i'), lst]);
    };
});

/**
 * Read and load all handlers in handlers folder automatically.
 * If file contains many handlers, its file name will be used as namespace.
 * Example: user.js -> user.login, user.logout, user.create
 */
function loadTerminals() {
    fs.readdirSync(path.join(__dirname, '..', 'terminals')).forEach((file) => {
        const terminal = require(`../terminals/${file}`);
        const name = file.replace(/^(.+)\.\w+$/, '$1');

        switch (typeof terminal) {
            case 'function':
                TERMINALS[name] = terminal;
                break;
            case 'object':
                Object.entries(terminal).forEach(([k, v]) => {
                    TERMINALS[`${name}.${k}`] = v;
                });
                break;
            default:
                break;
        }
    });
}

/**
 * Read pipeline configuration file and build a dictionary of routes.
 *
 */
function loadPipelineConfig() {
    const reg = /^(get|post|put|delete|options)\s([^\s]+)\s([^\s]+)$/i;
    rl.createInterface(
        fs.createReadStream(path.join(__dirname, '..', 'pipeline.config'), { encoding: 'utf-8' })
    ).on('line', (line) => {
        if (!reg.test(line)) {
            console.log(`Warn pipeline config: ${line}`);
            return;
        }

        const matches = reg.exec(line.trim());
        Pool[matches[1]](matches[2], matches[3].split('->'));
    });
}

Pool.routing = async (liquid) => {
    if (liquid.isStaticResource) {
        // Todo: implement pipline for static resources
        return;
    }

    const pipeline = PIPELINES[liquid.request.method.toLowerCase()] || [];
    let match;
    let p;
    for (let r of pipeline) {
        match = r[0].exec(liquid.uri.pathname);
        if (match) {
            p = r[1];
            break;
        }
    }

    if (!match) {
        Pool.emit('leak', Leakage.collect(404));
        return;
    }

    if (match.groups) {
        liquid.params = { ...match.groups };
    }

    await makePipeline(p, liquid);
};

Pool.global = function (data) {
    this.global = data;
    return this;
};

Pool.fail = function (error) {
    this.emit('fail', error);
};

Pool.start = function (port = 3000, addOns = {}) {
    loadTerminals();
    loadPipelineConfig();

    Object.entries(addOns).forEach(([k, v]) => {
        this[k] = v(this);
    });

    http.createServer(async (request, response) => {
        request.on('error', (err) => {
            Pool.fail(err);
        });
        response.on('error', (err) => {
            Pool.fail(err);
        });

        try {
            await Pool.routing(new Liquid(request, response, Pool));
        } catch (err) {
            Pool.emit('leak', err);
        }
    })
        .on('error', (err) => {
            Pool.fail(err);
        })
        .listen(port);

    console.log(`App is running at port: ${port}`);

    return Pool;
};
