const limit = 1024 * 1024;

const readStream = (liquid) => {
    let buffer = Buffer.alloc(0, { endcoding: 'utf-8' });
    let receive = 0;
    let complete = false;
    let resolve, reject;
    const result = new Promise((res, rej) => {
        [resolve, reject] = [res, rej];
    });
    liquid.request
        .on('data', (chunk) => {
            if (!complete) {
                receive += chunk.length;
                if (receive > limit) {
                    complete = true;
                    reject(liquid.collect(400, `Body size was over limit: ${limit} bytes`));
                    return;
                }
                buffer = Buffer.concat([buffer, chunk]);
            }
        })
        .on('end', async () => {
            complete = true;
            try {
                resolve(JSON.parse(buffer.toString('utf-8')));
            } catch (err) {
                const leak = liquid.collect(400, 'Body data was not recognized');
                leak.origin = err;
                reject(leak);
            }
        })
        .on('error', (err) => {
            reject(liquid.collect(err));
        });

    return result;
};

module.exports = async (liquid, next) => {
    if (
        !liquid.typeis([
            'application/json',
            'application/json-patch+json',
            'application/vnd.api+json',
            'application/csp-report',
        ])
    ) {
        liquid.fail(400, 'Not supported content-type');
        return;
    }

    try {
        liquid.payload = await readStream(liquid.request);
    } catch (err) {
        liquid.report(err);
        return;
    }

    await next();
};
