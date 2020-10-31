const fs = require('fs');
const path = require('path');

const rootFolder = path.join(__dirname, '..', 'web');

module.exports = async (liquid, next) => {
    liquid.filePathToRead = path.join(rootFolder, liquid.uri.pathname);

    if (!fs.existsSync(liquid.filePathToRead)) {
        liquid.fail(404, 'file not found');
        return;
    }

    if (liquid.uri.pathname.endsWith('.js')) {
        liquid.response.setHeader('Content-Type', 'application/javascript');
    } else if (liquid.uri.pathname.endsWith('.css')) {
        liquid.response.setHeader('Content-Type', 'text/css');
    } else if (liquid.uri.pathname.endsWith('.png')) {
        liquid.response.setHeader('Content-Type', 'image/png');
    } else if (liquid.uri.pathname.endsWith('.svg')) {
        liquid.response.setHeader('Content-Type', 'image/svg+xml');
    }

    const stat = fs.statSync(liquid.filePathToRead);
    liquid.response.setHeader('Cache-Control', 'max-age=3600'); // one hour
    liquid.response.setHeader('Last-Modified', stat.mtime.toUTCString());
    liquid.response.setHeader('Content-Length', stat.size);

    await next();
};
