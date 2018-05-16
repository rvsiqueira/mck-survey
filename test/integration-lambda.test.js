'use strict';

var expect = require( 'chai' ).expect;
//var test = require('tape');  
var lambdaLocal = require('lambda-local');  
var winston = require('winston');
var lambdasPath = '../'

function testLocalLambda(func, event, cb) {  
    var lambdaFunc = require(func);
    var lambdaEvent = require(event);
    winston.level = 'none'; //'error' //'debug', 'info'
    lambdaLocal.setLogger(winston);
    lambdaLocal.execute({
        event: lambdaEvent,
        lambdaFunc: lambdaFunc,
        lambdaHandler: 'handler',
        callbackWaitsForEmptyEventLoop: false,
        timeoutMs: 5000,
        mute: true,
        callback: cb
    });
}


describe( 'myLambdaAuth', function() {
    it( 'successful UserLogin Lambda', function( done ) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-login-data.js', function (_err, _data) {
            err = _err;
            result = _data;

            expect( result.login ).to.be.true;
            expect( err ).to.be.null;
        });
        done();
    });

    it( 'successful LostPassword', function( done ) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-lost-password-data.js', function (_err, _data) {
            err = _err;
            result = _data;

            expect( result.changed ).to.be.true;
        });
        done();
    });

    it( 'successful ChangePassword', function( done ) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-change-password-data.js', function (_err, _data) {
            err = _err;
            result = _data;

            expect( result.changed ).to.be.true;

        });
        done();
    });
});