module.exports = (app, config) => {
    const strings = require('../../resources/strings');
    const jwt = require('jsonwebtoken');

    app.use((req, res, next) => {
        const header = req.headers.authorization;
        if (header) {
            const token = header.split(' ')[1];
            jwt.verify(token, parseKey(config.get("node.oauth2.jwt.key-value")), (err, jwt) => {
                if (err) {
                    return res.status(403).json({
                        timestamp: new Date().toISOString(),
                        message: strings.AUTH_REQUIRED,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                }

                req.hasRole = role => {
                    return contains(jwt.authorities, role)
                };

                next();
            });
        } else {
            return res.status(401).json({
                timestamp: new Date().toISOString(),
                message: strings.AUTH_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        }
    });

    const contains = (haystack, needle) => {
        return haystack.some(r => needle.indexOf(r) >= 0)
    };

    const parseKey = key => {
        const beginKey = "-----BEGIN PUBLIC KEY-----";
        const endKey = "-----END PUBLIC KEY-----";

        const sanatizedKey = key.replace(beginKey, '').replace(endKey, '').replace('\n', '');
        const keyArray = sanatizedKey.split('').map((l, i) => {
            const position = i + 1;
            const isLastCharacter = sanatizedKey.length === position;
            if (position % 64 === 0 || isLastCharacter) {
                return l + '\n'
            }
            return l
        });
        return `${beginKey}\n${keyArray.join('')}${endKey}\n`
    };
};