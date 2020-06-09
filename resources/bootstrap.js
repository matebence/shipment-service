module.exports = {
    application: {
        name: "shipment-service"
    },
    cloud: {
        config: {
            uri: "http://192.168.99.100:8888",
            username: "app-blesk-config-server",
            password: "b8199f18ee07292f39f5d9213cf493e8"
        }
    },
    profiles: {
        active: "dev"
    },
    server: {
        port: process.env.PORT
    }
};