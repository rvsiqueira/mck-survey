var config = require('./config.json');
var jwt = require("jsonwebtoken");
var jwkToPem = require('jwk-to-pem');

var token = "eyJraWQiOiJ1cy1lYXN0LTExIiwidHlwIjoiSldTIiwiYWxnIjoiUlM1MTIifQ.eyJzdWIiOiJ1cy1lYXN0LTE6NTAwNzBiZmEtZTM2YS00ZTdmLWI1MzAtODMxMTBlNjg4ZWYzIiwiYXVkIjoidXMtZWFzdC0xOjAwMGI1ZDVkLWFjMjQtNGZiYi05MDllLTcwOWYyZTkwNTAyNSIsImFtciI6WyJhdXRoZW50aWNhdGVkIiwibG9naW4ubWNrc3VydmV5LmFwcCIsImxvZ2luLm1ja3N1cnZleS5hcHA6dXMtZWFzdC0xOjAwMGI1ZDVkLWFjMjQtNGZiYi05MDllLTcwOWYyZTkwNTAyNTpyYWZzaXF1ZWlyYUBtZS5jb20iXSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20iLCJleHAiOjE1MjYzMDc5ODgsImlhdCI6MTUyNjMwNzA4OH0.dE6sfNBFOoC9XXH62iqbUr1sqxSim7cXh_JQuku2iY6aLg2H_9JayftfH_t4YT7N__FODMKCGa_IE2ZXBg8JhvLL6k-p0jeN1HD0Coon2lvT_-2qpD2u9n4x5kycB9mTGIBfeIsKq0MWjgw5tTbWFISw_CyJej8peujQGMz8UAh1p0uD-bU6Fm7BesQCBDCMmFAh5gZPB5a4oIXRnIOJiVfsV4IOiQNtlYw-ON06rHGFpKfAopaZ_k1pqmhB4iSW2bYO_A9i20bfOPnxj2UEWygscyEm6FH2h-KeaN2oNDpa8K8hOb8vak3NwwICzjo7Geykjam25gBCoGVvDRf_sQ";
var token2 = "eyJraWQiOiJ1cy1lYXN0LTExIiwidHlwIjoiSldTIiwiYWxnIjoiUlM1MTIifQ.eyJzdWIiOiJ1cy1lYXN0LTE6NTAwNzBiZmEtZTM2YS00ZTdmLWI1MzAtODMxMTBlNjg4ZWYzIiwiYXVkIjoidXMtZWFzdC0xOjAwMGI1ZDVkLWFjMjQtNGZiYi05MDllLTcwOWYyZTkwNTAyNSIsImFtciI6WyJhdXRoZW50aWNhdGVkIiwibG9naW4ubWNrc3VydmV5LmFwcCIsImxvZ2luLm1ja3N1cnZleS5hcHA6dXMtZWFzdC0xOjAwMGI1ZDVkLWFjMjQtNGZiYi05MDllLTcwOWYyZTkwNTAyNTpyYWZzaXF1ZWlyYUBtZS5jb20iXSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20iLCJleHAiOjE1MjY0NDE2NDQsImlhdCI6MTUyNjQ0MDc0NH0.JLz_fvn2dZxZjve9PETmPHTYahig9tnfd6aAaOdGUR7Jw9bGC-RQOqMSQHav9koKj64bsPcxJaBJvZFAR3itymAe_WkSvf-lnvS6UmxDSngS7o8GBLynOZ1mq-OaOayRwbGzxcCxweGEZwofzSWlwCkfygsSglFK0SGvCQkqtlM2Yilgtk1dEDTPR1UxsfChBahwaCmbuR3tg8r5l6TFX_0MO5EwZCuaSUy2vKNp6pKF1dgs6a1fRXFnA1aJUrgI1KJSZrMGtwYZT4X0VAwiK6K5ze0wWjmJniSv-LXJsSHgNXn4HNPED1HIJ7idfOhdfkzbkbjD8xxRCInQSVj1_Q";

function verifyToken(token, fn) {
    
    var jwk = config.COGNITO_PUBLIC_KEY;
    var pem = jwkToPem(jwk);

    try {
        var decoded = jwt.verify(token, pem, {algorithms: ['RS512']});
        return fn(null, decoded); // successful response
    } catch(err) {
        return fn(err); // an error occurred
    }

    
}

verifyToken(token2, function(err, decoded) {
    if (err) {
        console.log(err.name + ": " + err.message);
    } else {
        console.log(decoded.amr[2]);
    }
});