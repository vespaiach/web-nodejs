const { Pool: PgPool } = require('pg');

module.exports = function (Pool) {
    const pp = new PgPool();

    // the pool will emit an error on behalf of any idle clients
    // it contains if a backend error or network partition happens
    pp.on('error', (err) => {
        Pool.fail(err);
    });

    const query = async (...args) => {
        return await pp.query(...args);
    };

    const exec = async (...args) => {
        const client = await pp.connect();
        const query = client.query;
        const release = client.release;

        try {
            return await query(...args);
        } catch (e) {
            Pool.fail(e);
        } finally {
            release();
        }
    };

    Pool.db = { exec, query };
};
