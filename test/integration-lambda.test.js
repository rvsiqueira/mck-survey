'use strict';

var expect = require( 'chai' ).expect;
var lambdaLocal = require('lambda-local');  
var winston = require('winston');
var lambdasPath = '../'
var loginToken = '';

function testLocalLambda(func, event, cb) {  
    var lambdaFunc = require(func);
    var lambdaEvent = require(event);
    lambdaEvent.token = loginToken;
    winston.level = 'debug'; //'error' //'debug', 'info', 'none'
    lambdaLocal.setLogger(winston);
    lambdaLocal.execute({
        event: lambdaEvent,
        lambdaFunc: lambdaFunc,
        lambdaHandler: 'handler',
        callbackWaitsForEmptyEventLoop: false,
        timeoutMs: 10000,
        mute: true,
        callback: cb
    });
}


describe( 'myUserAuth', function() {
    this.timeout(60000);
    it( 'successful CreateUser Lambda', function(done) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-create-user-data.js', function (_err, _data) {
            var err = _err;
            var result = _data;
            expect( result.created ).to.be.true;
            expect(err).to.not.exist;
            done();
        });
    });

    it( 'error CreateUser Lambda', function(done) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-create-user-data.js', function (_err, _data) {
            var err = _err;
            var result = _data;
            expect( result.created ).to.be.false;
            expect(err).to.not.exist;
            done();
        });
    });

    it( 'successful UserLogin Lambda', function( done ) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-login-data.js', function (_err, _data) {
            var err = _err;
            var result = _data;
            loginToken = result.token;
            expect( result.login ).to.be.true;
            expect( err ).to.not.exist;
            done();
        });
    });

    it( 'error UserLogin Lambda', function( done ) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-error-login-data.js', function (_err, _data) {
            var err = _err;
            var result = _data;
            expect( result.login ).to.be.false;
            expect( err ).to.not.exist;
            console.log(result.message);
            done();
        });
    });

    it( 'successful LostPassword', function( done ) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-lost-password-data.js', function (_err, _data) {
            var err = _err;
            var result = _data;
            
            expect( result.sent ).to.be.true;
            done();
        });
    });

    it( 'successful ChangePassword', function( done ) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-change-password-data.js', function (_err, _data) {
            var err = _err;
            var result = _data;

            expect( result.changed ).to.be.true;
            done();

        });

    });

    it( 'successful DeleteUser', function( done ) {
        testLocalLambda(lambdasPath + 'index.js', lambdasPath + '/event-samples/test-delete-user-data.js', function (_err, _data) {
            var err = _err;
            var result = _data;

            expect( result.deleted ).to.be.true;
            done();

        });

    });

});