'use strict';

var expect = require( 'chai' ).expect;

var myLambda = require( '../index' );

describe( 'myLambdaAuth', function() {
    it( 'successful login invocation: UserLogin', function( done ) {
        
        var event = {};
        event.type = "UserLogin";
        event.email = "rafsiqueira@me.com";
        event.password = "1234";
        
        
        
        var context = {
            succeed: function( result ) {
                expect( result.login ).to.be.true;
                done();
            },
            fail: function() {
                done( new Error( 'never context.fail' ) );
            }
        }
            
	    
        myLambda.handler(event, context);
    });

    it( 'wrong password invocation: UserLogin', function( done ) {
        
        var event = {};
        event.type = "UserLogin";
        event.email = "rafsiqueira@me.com";
        event.password = "123";
        
        
        
        var context = {
            succeed: function( result ) {
                expect( result.login ).to.be.false;
                done();
            },
            fail: function() {
                expect(err.login).to.be.false;
                //expect( err.message ).to.equal( 'unknown name' );
                done();
            }
        }
            
	    
        myLambda.handler(event, context);
    });



});