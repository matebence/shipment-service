const client = require('./eureka.component');
const Resilient = require('resilient');

const proxy = {};
client.start(result => {
    proxy.resilient = (service, token) => Resilient({
        service: {
            basePath: '/api',
            retry: 3,
            waitBeforeRetry: 500,
            timeout: 6000,
            // servers: client.getInstancesByAppId(service).map((e) => {return e.homePageUrl;}),
            servers: ['http://192.168.99.100:7100'],
            headers: {
                Authorization: token
            }
        },
        balancer: {
            random: true,
            roundRobin: true
        }
    }).addFailStrategy((err, res) => {
        return !err && res.statusCode >= 300
    }).on('request:finish', function (err, res) {
        if (err) return;

        const path = res.socket._httpMessage.path.toString();
        if(path.includes("accounts")){
            res.data = res.data._embedded.accountsList
        }
    })
});
module.exports = proxy;