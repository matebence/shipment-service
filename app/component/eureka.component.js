module.exports = (app, config) => {
    const Eureka = require('eureka-js-client').Eureka;

    const eureka = {
        instance: {
            app: config.bootstrap.application.name.toUpperCase(),
            hostName: require('os').hostname(),
            ipAddr: require('ip').address(),
            instanceId: `${require('os').hostname()}:${config.bootstrap.application.name}:${config.bootstrap.server.port}`,
            statusPageUrl: `http://${config.bootstrap.application.name}:${config.bootstrap.server.port}`,
            vipAddress: config.bootstrap.application.name,
            status: "UP",
            port: {
                $: config.bootstrap.server.port,
                '@enabled': 'true',
            },
            dataCenterInfo: {
                '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
                name: 'MyOwn',
            },
            registerWithEureka: true,
            fetchRegistry: true,
        },
        eureka: {
            host: config.get('node.eureka.host'),
            port: config.get('node.eureka.port'),
            servicePath: config.get('node.eureka.service-path'),
        }
    };

    module.exports = new Eureka({instance: eureka.instance, eureka: eureka.eureka});
};