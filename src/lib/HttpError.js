module.exports = exports = HttpError;

const ErrCodes = {
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    421: 'Misdirected Request',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required',
};

function HttpError() {
    Error.captureStackTrace(this, HttpError);
}

HttpError.prototype.toJson = function () {
    return {
        errors: this.messages,
    };
};

HttpError.prototype.addMessage = function (message) {
    this.messages.push(message);
};

HttpError.create = function () {
    const err = new HttpError();

    if (arguments.length === 1) {
        if (typeof arguments[0] === 'number') {
            const code = ErrCodes[arguments[0]] ? arguments[0] : 500;
            err.messages = [ErrCodes[arguments[0]]];
            err.statusCode = code;
        } else if (typeof arguments[0] === 'string') {
            err.messages = [arguments[0]];
            err.statusCode = 500;
        } else if (arguments[0] instanceof Error) {
            err.messages = [arguments[0].message];
            err.statusCode = 500;
            err.origin = err;
        } else {
            err.messages = 'Unknown Error';
            err.statusCode = 500;
            err.origin = err;
        }
    } else {
        err.statusCode = arguments[0];
        this.messages = [];
        for (let i = 1; i < arguments.length; i++) {
            this.messages.push(String(arguments[i]));
        }
    }

    return;
};
