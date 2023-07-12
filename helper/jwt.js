const {expressjwt} = require('express-jwt')

function authJwt() {
    const secret = process.env.secret;

    return expressjwt({
        secret,
        algorithms: ['HS256'],
     //   isRevoked: isRevoked
    }).unless({
        path: [
            {url: /products(.*)/ , methods: ['GET', 'OPTIONS'] },
            {url: /categories(.*)/ , methods: ['GET', 'OPTIONS'] },
            `/api/v1/users/login`,
            `/api/v1/users/register`
        ]
})
}

// async function isRevoked(req, payload, done) {
//     if(!payload.isAdmin) {
//         done(null, true)
//     }
//     done();
// }

module.exports = authJwt;