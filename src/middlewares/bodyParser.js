const limit = 1024 * 1024;
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

    let buffer = Buffer.alloc(0, { endcoding: 'utf-8' });
    let receive = 0;
    let complete = false;

    ctx.req
        .on('data', (chunk) => {
            if (!complete) {
                receive += chunk.length;
                if (receive > limit) {
                    complete = true;
                    ctx.throw(400, 'request size was over limit', { expose: true });
                    return;
                }

                buffer = Buffer.concat([buffer, chunk]);
            }
        })
        .on('end', () => {
            complete = true;
            try {
                ctx.payload = JSON.parse(buffer.toString('utf-8'));
            } catch (err) {
                ctx.throw(400, 'bad payload', { expose: true });
                return;
            }
            next();
        })
        .on('error', (err) => {
            ctx.throw(500, err, { expose: false });
        });
};
