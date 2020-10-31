const fs = require('fs');
const path = require('path');

const filePathToIndex = path.join(__dirname, '..', 'web', 'index.html');

module.exports = async (liquid, next) => {
    liquid.filePathToRead = filePathToIndex;

    if (!fs.existsSync(liquid.filePathToRead)) {
        liquid.fail(404, 'Resource not found');
        return;
    }

    liquid.response.setHeader('Content-Type', 'text/html');

    const stat = fs.statSync(filePathToIndex);
    liquid.response.setHeader('Cache-Control', 'no-cache');
    liquid.response.setHeader('Last-Modified', stat.mtime.toUTCString());
    liquid.response.setHeader('Content-Length', stat.size);

    await next();
};
