const fs = require('fs');

module.exports = async (liquid) => {
    let fileStream;
    const destroy = (e) => {
        if (fileStream && !fileStream.destroyed) {
            fileStream.destroy(e);
        }
    };
    try {
        fileStream = fs.createReadStream(liquid.filePathToRead);
        fileStream.on('error', (e) => {
            destroy(e);
            liquid.fail(500, 'server error');
        });
        liquid.response.on('error', destroy);
        liquid.response.on('finish', destroy);
        fileStream.pipe(liquid.response);
    } catch (e) {
        destroy(e);
        liquid.fail(500, 'server error');
    }
};
