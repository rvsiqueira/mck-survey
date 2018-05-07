const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const uuidv1 = require('uuid/v1');

// Create DynamoDB document client
var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
  
function createItem(name, description)
{
    var params = {
        TableName: 'MCK.Survey',
        Item: {
          'SurveyId': uuidv1(),
          'Name': name,
          'Description': description,
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

function updateItem(surveyId, name, description)
{

    var params = {
        TableName: 'MCK.Survey',
        Key: {
            'SurveyId': surveyId
        },
        UpdateExpression : 'set #name = :name , #description = :description',
        ExpressionAttributeValues : {
            ':name': name,
            ':description': description
        },
        ExpressionAttributeNames:{
            "#name": "Name",
            "#description": "Description"
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

function getItem(surveyId)
{
    var params = {
        TableName: 'MCK.Survey',
        ExpressionAttributeValues: {
            ':s': surveyId
        },
        KeyConditionExpression: 'SurveyId = :s',
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

function deleteById(surveyId)
{
    var params = {
        Key: {
          'SurveyId': surveyId
        },
        TableName: 'MCK.Survey'
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


updateItem("9eebeaf0-5168-11e8-8cf2-5fe8b44d6870","Teste 4", "Testando Survey 2");
createItem("Teste 2", "Testando Survey 2");
getItem('9eebeaf0-5168-11e8-8cf2-5fe8b44d6870');
//deleteById('a5b74460-5168-11e8-8f45-b5cba1aa9547');
getItemByName('Teste');