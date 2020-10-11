const { URL } = require('url');
const Leakage = require('./Leakage');

/**
 * Liquid is data that flows inside pipeline
 */
module.exports = exports = Liquid;

/**
 * End pipline and return data in json response
 * @param {Number} statusCode http code
 * @param {Object} data response data
 * @param {Object} extraHeaders more header data
 */
function done(statusCode, data, extraHeaders = {}) {
    this.response.statusCode = statusCode;
    const body = JSON.stringify(data);
    this.response.setHeader('Content-Type', 'application/json');
    this.response.setHeader('Content-Length', Buffer.byteLength(body));
    Object.entries(extraHeaders).forEach(([k, v]) => {
        this.response.setHeader(k, v);
    });
    this.response.end(body);
}

function ok(statusCode, data, extraHeaders = {}) {
    done(statusCode, { data }, extraHeaders);
}

function fail(statusCode, errors, extraHeaders = {}) {
    done(statusCode, { errors: Array.isArray(errors) ? errors : [errors] }, extraHeaders);
}

function done204() {
    this.response.statusCode = 204;
    this.response.removeHeader('Content-Type');
    this.response.removeHeader('Transfer-Encoding');
    return this.response.end();
}

function typeis(types) {
    const contentType = this.request.headers['content-type'];
    if (!contentType) {
        return false;
    }
    return (Array.isArray(types) ? types : [types]).some((t) => t === contentType);
}

function panic(...args) {
    throw Leakage.collect(...args);
}

function report(...args) {
    this.Pool.emit('leak', Leakage.collect(...args));
}

/**
 * Collect information about the error
 * @param  {...any} args 
 */
function collect(...args) {
    return Leakage.collect(...args);
}

function Liquid(request, response, Pool) {
    const protocol =
        (request.connection && request.connection.encrypted) ||
        (request.headers['x-forwarded-proto'] || request.headers['x-forwarded-protocol']) ===
            'https'
            ? 'https'
            : 'http';
    this.uri = new URL(request.url, `${protocol}://${request.headers.host}`);
    this.isStaticResource = /\.\w{2,8}($|\?)+/i.test(this.uri.pathname);
    this.request = request;
    this.response = response;
    this.Pool = Pool;
}

Liquid.prototype = {
    done,
    done204,
    typeis,
    panic,
    report,
    collect,
    ok,
    fail,
};
