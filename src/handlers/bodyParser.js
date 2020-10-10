const limit = 1024 * 1024;

const readStream = (ctx) => {
    let buffer = Buffer.alloc(0, { endcoding: 'utf-8' });
    let receive = 0;
    let complete = false;
    let resolve, reject;
    const result = new Promise((res, rej) => {
        [resolve, reject] = [res, rej];
    });
    ctx.request
        .on('data', (chunk) => {
            if (!complete) {
                receive += chunk.length;
                if (receive > limit) {
                    complete = true;
                    reject(ctx.HttpError.create(400, `body size was over limit: ${limit} bytes`));
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
                reject(ctx.HttpError.create(err));
            }
        })
        .on('error', (err) => {
            reject(ctx.HttpError.create(err));
        });

    return result;
};

module.exports = async (ctx, next) => {
    if (
        !ctx.typeis([
            'application/json',
            'application/json-patch+json',
            'application/vnd.api+json',
            'application/csp-report',
        ])
    ) {
        ctx.alertError(400, 'Not supported content-type');
        return;
    }

    try {
        ctx.payload = await readStream(ctx.request);
    } catch (err) {
        ctx.alertError(err);
        return;
    }

    await next();
};
