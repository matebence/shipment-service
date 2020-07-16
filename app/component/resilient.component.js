module.exports = (app, config, callback) => {
    const client = require('./eureka.component');
    const Resilient = require('resilient');

    const proxy = {};
    client.start(result => {
        proxy.resilient = (service) => Resilient({
            service: {
                basePath: config.get('node.resilient.basePath'),
                retry: config.get('node.resilient.retry'),
                waitBeforeRetry: config.get('node.resilient.waitBeforeRetry'),
                timeout: config.get('node.resilient.timeout'),
                servers: client.getInstancesByAppId(service).map((e) => {return `http://${e.vipAddress}:${e.port.$}`;}),
                headers: {Authorization: `Bearer ${config.get('blesk.server-key')}`}
            },
            balancer: {
                random: true,
                roundRobin: true
            }
        }).addFailStrategy((err, res) => {
            return !err && res.statusCode >= 300
        }).on('request:finish', function (err, res) {
            if (!err && res.socket._httpMessage.path.toString().includes("accounts") && '_embedded' in res.data) {
                res.data = res.data._embedded.accountJoinValuesByColumnList
            }
        });
        callback()
    });

    module.exports = proxy;
};