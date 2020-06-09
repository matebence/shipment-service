module.exports = (app, config) => {
    const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;
    const {BatchRecorder, jsonEncoder: {JSON_V2}} = require('zipkin');
    const {HttpLogger} = require('zipkin-transport-http');
    const CLSContext = require('zipkin-context-cls');
    const {Tracer} = require('zipkin');

    const tracer = new Tracer({
        ctxImpl: new CLSContext('zipkin'),
        recorder: new BatchRecorder({
            logger: new HttpLogger({
                endpoint: `${config.get('node.zipkin.base-url')}/api/v2/spans`,
                jsonEncoder: JSON_V2
            })
        }),
        localServiceName: config.bootstrap.application.name
    });

    app.use(zipkinMiddleware({tracer}));
};