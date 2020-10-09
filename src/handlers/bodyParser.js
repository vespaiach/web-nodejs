const limit = 1024 * 1024;

const readStream = (stream) => {
    let buffer = Buffer.alloc(0, { endcoding: 'utf-8' });
    let receive = 0;
    let complete = false;
    let resolve, reject;
    const result = new Promise((res, rej) => {
        [resolve, reject] = [res, rej];
    });
    stream
        .on('data', (chunk) => {
            if (!complete) {
                receive += chunk.length;
                if (receive > limit) {
                    complete = true;
                    reject({ code: 400, message: `body size was over limit: ${limit} bytes` });
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
                reject({ code: 400, message: 'bad body' });
            }
        })
        .on('error', (err) => {
            reject({ code: 500, message: 'server error', err });
        });

    return result;
};

module.exports = async (ctx, next) => {
    if (
        !ctx.request.is([
            'application/json',
            'application/json-patch+json',
            'application/vnd.api+json',
            'application/csp-report',
        ])
    ) {
        ctx.throw(400, 'not support content-type', { expose: true });
        return;
    }

    try {
        ctx.payload = await readStream(ctx.req);
    } catch (err) {
        ctx.throw(err.code, err.message, { expose: err.code < 500, origin: err });
        return;
    }

    await next();
};
