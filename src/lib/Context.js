const { EventEmitter } = require('events');
const { URL } = require('url');
const HttpError = require('./HttpError');

/**
 *
 * Every request will get a context instance initially and
 * that context object has some utility functions as long as
 * it can carry temporary data while resolving request
 *
 *
 */

module.exports = exports = Context;

function text(statusCode, data) {
    this.response.statusCode = statusCode;
    this.response.setHeader('Content-Type', 'text/plain');
    this.response.setHeader('Content-Length', Buffer.byteLength(data));
    this.response.end(data);
}

function json(statusCode, ...rest) {
    this.response.statusCode = statusCode;
    const body = JSON.stringify({ ...rest });
    this.response.setHeader('Content-Type', 'application/json');
    this.response.setHeader('Content-Length', Buffer.byteLength(body));
    this.response.end(body);
}

function ok204() {
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

function alertError(...args) {
    this.emit('error', HttpError.create(...args));
}

function Context(request, response) {
    EventEmitter.call(this);
    const protocol =
        (request.connection && request.connection.encrypted) ||
        (request.headers['x-forwarded-proto'] || request.headers['x-forwarded-protocol']) ===
            'https'
            ? 'https'
            : 'http';
    this.request = request;
    this.response = response;

    this.throw = function (...args) {
        throw HttpError.create(...args);
    };
    this.json = json;
    this.ok204 = ok204;
    this.text = text;
    this.alertError = alertError;
    this.typeis = typeis;
    this.uri = new URL(request.url, `${protocol}://${request.headers.host}`);
    this.isStaticFile = /\.\w{2,8}($|\?)+/.test(this.uri.pathname);
    this.HttpError = HttpError;
}

Context.prototype = Object.create(EventEmitter.prototype);

Object.defineProperty(Context.prototype, 'constructor', {
    value: Context,
    enumerable: false,
    writable: true,
});
