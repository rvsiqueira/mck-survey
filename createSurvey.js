const doc = require('dynamodb-doc');
const AWS = require('aws-sdk');

var dynamo = new doc.DynamoDB();
dynamo = require('dynamodb');

/** 
* Our little schema
*/
var SurveyItem = dynamo.define('SurveyItem', {
    hashKey : 'id',
    tableName:'gatesentry_installations',
    timestamps : true,
    schema : {
      SurveyId : dynamo.types.uuid(),
      Name : "Design Survey",
      Description : "Minha Primeira Pesquisa",
    }
});
  
  
function createItem( payload, callback ) {
    SurveyItem.create(payload, function (err, item) {
        if (err){
            console.log("Error storing data", err);
            callback(err, { message: 'Unable to create data', item });
        }else{
            callback(null, { message: 'Item created succesfully', item });
        }
    });
}