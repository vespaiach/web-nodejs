const Leakage = require('./Leakage');

module.exports = exports = async function makePipeline(terminals, liquid, Pool) {
    try {
        const firstTerminal = installTerminals(terminals);
        await firstTerminal(liquid);
    } catch (err) {
        Pool.emit('leak', Leakage.collect(err));
    }
};

/**
 * Make array of functions to be called in a chain.
 * Source: https://github.com/koajs/compose
 * @param {Array} terminals list of handler function
 */
function installTerminals(terminals) {
    return function dispatch(pipeline) {
        let lastIndex = -1;
        function dispatch(i) {
            if (i < lastIndex) {
                return Promise.reject();
            }
            lastIndex = i;
            let fn = terminals[i];
            if (!fn) {
                return Promise.resolve();
            }
            try {
                return Promise.resolve(fn(pipeline, dispatch.bind(null, i + 1)));
            } catch (e) {
                return Promise.reject(e);
            }
        }
        dispatch(0);
    };
}
