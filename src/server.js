const http = require('http');

const server = http.createServer();
server.on('request', function (request, response) {
    response.write('hello');
    response.end();
});

module.exports = server;
