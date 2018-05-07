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
var ses = new AWS.SES();

function computeHash(password, salt, fn) {
	// Bytesize
	var len = config.CRYPTO_BYTE_SIZE;
	var iterations = 4096;

	if (3 == arguments.length) {
		crypto.pbkdf2(password, salt, iterations, len, function(err, derivedKey) {
			if (err) return fn(err);
			else fn(null, salt, derivedKey.toString('base64'));
		});
	} else {
		fn = salt;
		crypto.randomBytes(len, function(err, salt) {
			if (err) return fn(err);
			salt = salt.toString('base64');
			computeHash(password, salt, fn);
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
				userId: {
					S: uuidv1()
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

//Getting all user information to verify token sent by email 
function getUserVerification(email, fn) {
	dynamodb.getItem({
		TableName: config.DDB_USER_TABLE,
		Key: {
			email: {
				S: email
			}
		}
	}, function(err, data) {
		if (err) return fn(err);
		else {
			if ('Item' in data) {
				var verified = data.Item.verified.BOOL;
				var verifyToken = null;
				if (!verified) {
					verifyToken = data.Item.verifyToken.S;
				}
				fn(null, verified, verifyToken);
			} else {
				fn(null, null); // User not found
			}
		}
	});
}

//Account Confirmation Upadate
function updateUserVerification(email, fn) {
	dynamodb.updateItem({
			TableName: config.DDB_USER_TABLE,
			Key: {
				email: {
					S: email
				}
			},
			AttributeUpdates: {
				verified: {
					Action: 'PUT',
					Value: {
						BOOL: true
					}
				},
				verifyToken: {
					Action: 'DELETE'
				}
			}
		},
		fn);
}

function updateUserPassword(email, password, salt, fn) {
	dynamodb.updateItem({
			TableName: config.DDB_TABLE,
			Key: {
				email: {
					S: email
				}
			},
			AttributeUpdates: {
				passwordHash: {
					Action: 'PUT',
					Value: {
						S: password
					}
				},
				passwordSalt: {
					Action: 'PUT',
					Value: {
						S: salt
					}
				}
			}
		},
		fn);
}

function getUserLogin(email, fn) {
	dynamodb.getItem({
		TableName: config.DDB_USER_TABLE,
		Key: {
			email: {
				S: email
			}
		}
	}, function(err, data) {
		if (err) return fn(err);
		else {
			if ('Item' in data) {
				var hash = data.Item.passwordHash.S;
				var salt = data.Item.passwordSalt.S;
				var verified = data.Item.verified.BOOL;
				var userId = data.Item.userId.S;
				fn(null, hash, salt, verified, userId);
			} else {
				fn(null, null); // User not found
			}
		}
	});
}

exports.handler = function(event, context) {
	
	var type = event.type;

	if(type == 'CreateUser') {
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
	} else if(type == 'VerifyUser') {
		var email = event.email;
		var verifyToken = event.verify;

		getUserVerification(email, function(err, verified, correctToken) {
			if (err) {
				context.fail('Error in getUser: ' + err);
			} else if (verified) {
				console.log('User already verified: ' + email);
				context.succeed({
					verified: true
				});
			} else if (verifyToken == correctToken) {
				// User verified
				updateUserVerification(email, function(err, data) {
					if (err) {
						context.fail('Error in updateUser: ' + err);
					} else {
						console.log('User verified: ' + email);
						context.succeed({
							verified: true
						});
					}
				});
			} else {
				// Wrong token, not verified
				console.log('User not verified: ' + email);
				context.succeed({
					verified: false
				});
			}
		});
	} else if(type == 'UserLogin') {
		var email = event.email;
		var clearPassword = event.password;

		getUserLogin(email, function(err, correctHash, salt, verified, userId) {
			if (err) {
				context.fail('Error in getUser: ' + err);
			} else {
				if (correctHash == null) {
					// User not found
					console.log('User not found: ' + email);
					context.succeed({
						login: false
					});
				} else if (!verified) {
					// User not verified
					console.log('User not verified: ' + email);
					context.succeed({
						login: false,
						verified: false,
					});
				} else {
					computeHash(clearPassword, salt, function(err, salt, hash) {
						if (err) {
							context.fail('Error in hash: ' + err);
						} else {
							console.log('correctHash: ' + correctHash + ' hash: ' + hash);
							if (hash == correctHash) {
								// Login ok
								console.log('User logged in: ' + email);
								context.succeed({
									login: true,
									userId: userId
								});
									}
								});
							} else {
								// Login failed
								console.log('User login failed: ' + email);
								context.succeed({
									login: false
								});
							}
						}
					});
				}
			}
	});
	} else if(type = 'ChangePassword') {
		var email = event.email;
		var oldPassword = event.oldPassword;
		var newPassword = event.newPassword;
		getUser(email, function(err, correctHash, salt, verified, userId) {
			if (err) {
				context.fail('Error in getUser: ' + err);
			} else {
				if (correctHash == null) {
					// User not found
					console.log('User not found: ' + email);
					context.succeed({
						changed: false
					});
				} else {
					computeHash(oldPassword, salt, function(err, salt, hash) {
						if (err) {
							context.fail('Error in hash: ' + err);
						} else {
							if (hash == correctHash) {
								// Login ok
								console.log('User logged in: ' + email);
								computeHash(newPassword, function(err, newSalt, newHash) {
									if (err) {
										context.fail('Error in computeHash: ' + err);
									} else {
										updateUserPassword(email, newHash, newSalt, function(err, data) {
											if (err) {
												context.fail('Error in updateUser: ' + err);
											} else {
												console.log('User password changed: ' + email);
												context.succeed({
													changed: true
												});
											}
										});
									}
								});
							} else {
								// Login failed
								console.log('User login failed: ' + email);
								context.succeed({
									changed: false
								});
							}
						}
					});
				}
			}
		});
	} else {
								context.fail('Method not available');
	}
	
}


//updateItem("9eebeaf0-5168-11e8-8cf2-5fe8b44d6870","Teste 4", "Testando Survey 2");
//createItem("Teste 2", "Testando Survey 2");
//getItem('9eebeaf0-5168-11e8-8cf2-5fe8b44d6870');
//deleteById('a5b74460-5168-11e8-8f45-b5cba1aa9547');
//getItemByName('Teste');