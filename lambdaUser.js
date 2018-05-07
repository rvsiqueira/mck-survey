console.log('Loading User function');

// dependencies
const AWS = require('aws-sdk');
const uuidv1 = require('uuid/v1');
var crypto = require('crypto');
var util = require('util');
var config = require('./config.json');

// Get reference to AWS clients
AWS.config.update({region: config.REGION});
var dynamodb = new AWS.DynamoDB();
//var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
var ses = new AWS.SES();

function computeHash(password, salt, fn) {
	// Bytesize
	var len = config.CRYPTO_BYTE_SIZE;
	var iterations = 4096;

	if (3 == arguments.length) {
		crypto.pbkdf2(password, salt, iterations, len, fn);
	} else {
		fn = salt;
		crypto.randomBytes(len, function(err, salt) {
			if (err) return fn(err);
			salt = salt.toString('base64');
			crypto.pbkdf2(password, salt, iterations, len, function(err, derivedKey) {
				if (err) return fn(err);
				fn(null, salt, derivedKey.toString('base64'));
			});
		});
	}
}

function sendVerificationEmail(email, token, fn) {
	var subject = 'Verification Email for ' + config.EXTERNAL_NAME;
	var verificationLink = config.VERIFICATION_PAGE + '?email=' + encodeURIComponent(email) + '&verify=' + token;
	ses.sendEmail({
		Source: config.EMAIL_SOURCE,
		Destination: {
			ToAddresses: [
				email
			]
		},
		Message: {
			Subject: {
				Data: subject
			},
			Body: {
				Html: {
					Data: '<html><head>'
					+ '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
					+ '<title>' + subject + '</title>'
					+ '</head><body>'
					+ 'Please <a href="' + verificationLink + '">click here to verify your email address</a> or copy & paste the following link in a browser:'
					+ '<br><br>'
					+ '<a href="' + verificationLink + '">' + verificationLink + '</a>'
					+ '</body></html>'
				}
			}
		}
	}, fn);
}


function storeUser(email, name, password, salt, fn) {
	// Bytesize
	var len = config.CRYPTO_BYTE_SIZE;
	crypto.randomBytes(len, function(err, token) {
		if (err) return fn(err);
		token = token.toString('hex');
		dynamodb.putItem({
			TableName: config.DDB_USER_TABLE,
			Item: {
				email: {
					S: email
				},
				name: {
					S: name
				},
				passwordHash: {
					S: password
				},
				passwordSalt: {
					S: salt
				},
				verified: {
					BOOL: false
				},
				verifyToken: {
					S: token
				}
			},
			ConditionExpression: 'attribute_not_exists (email)'
		}, function(err, data) {
			if (err) return fn(err);
			else fn(null, token);
		});
	});
}

exports.handler = function(event, context) {
	var email = event.email;
	var clearPassword = event.password;
	var name = event.name;

	computeHash(clearPassword, function(err, salt, hash) {
		if (err) {
			context.fail('Error in hash: ' + err);
		} else {
			storeUser(email, name, hash, salt, function(err, token) {
				if (err) {
					if (err.code == 'ConditionalCheckFailedException') {
						// userId already found
						context.succeed({
							created: false
						});
					} else {
						context.fail('Error in storeUser: ' + err);
					}
				} else {
					sendVerificationEmail(email, token, function(err, data) {
						if (err) {
							context.fail('Error in sendVerificationEmail: ' + err);
						} else {
							context.succeed({
								created: true
							});
						}
					});
				}
			});
		}
	});
}


/*
function createItem(name, username, password, email )
{
		var hashpassword = password;
		
    var params = {
        TableName: 'MCK.User',
        Item: {
          'UserId': uuidv1(),
          'Name': name,
          'Username': username,
					'Password': hashpassword,
					'Email': email,
          'CreatedAt:': Date.now()
        },
        ReturnConsumedCapacity : "TOTAL",
        ReturnValues : "ALL_OLD"  
    };

    docClient.put(params, function(err, data) {
        if (err) {
            console.log("Error Create Item: ", err);
        } else {
            console.log("Success Create Item: ", data);
        }
    });
}


function updateItem(userId, name, username, email )
{

    var params = {
        TableName: 'MCK.User',
        Key: {
            'UserId': userId
        },
        UpdateExpression : 'set #name = :name , #username = :username, #email = :email',
        ExpressionAttributeValues : {
            ':name': name,
            ':username': username,
						':email': email
        },
        ExpressionAttributeNames:{
            "#name": "Name",
            "#username": "Username",
						"#email": "Email"
        },
        ReturnConsumedCapacity : "TOTAL",
        ReturnValues : "ALL_NEW"
    }

    docClient.update(params, function(err, data) {
        if (err) {
            console.log("Error Update Item: ", err);
        } else {
            console.log("Success Update Item: ", data);
        }
    });
}

function getItem(userId)
{
    var params = {
        TableName: 'MCK.User',
        ExpressionAttributeValues: {
            ':s': userId
        },
        KeyConditionExpression: 'UserId = :s',
        ReturnConsumedCapacity : "TOTAL"  
    };
     console.log(params);
    
    docClient.query(params, function(err, data) {
        if (err) {
            console.log("Error Get Item: ", err);
        } else {
            console.log("Success Get Item: ", data);
        }
    });
}

function getItemByName(name)
{
    var params = {
        TableName: 'MCK.Survey',
        IndexName: "SurveyNames",
        KeyConditionExpression: '#name = :n',
        ExpressionAttributeValues: {
            ':n': name
        },
        ExpressionAttributeNames:{
            "#name": "Name"
        },
        ScanIndexForward : false,
        ReturnConsumedCapacity : "TOTAL"
    };
     console.log(params);
    
    docClient.query(params, function(err, data) {
        if (err) {
            console.log("Error Get Item By Name: ", err);
        } else {
            console.log("Success Get Item By Name: ", data);
        }
    });
}

function deleteById(userId)
{
    var params = {
        Key: {
          'UserId': userId
        },
        TableName: 'MCK.User'
    };

     console.log(params);
    
    docClient.delete(params, function(err, data) {
        if (err) {
            console.log("Error Delete Item: ", err);
        } else {
            console.log("Success Delete Item: ", data);
        }
    });
}
*/

updateItem("9eebeaf0-5168-11e8-8cf2-5fe8b44d6870","Teste 4", "Testando Survey 2");
createItem("Teste 2", "Testando Survey 2");
getItem('9eebeaf0-5168-11e8-8cf2-5fe8b44d6870');
//deleteById('a5b74460-5168-11e8-8f45-b5cba1aa9547');
getItemByName('Teste');