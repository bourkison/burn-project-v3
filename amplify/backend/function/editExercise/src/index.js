const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const mongooseModels = require('/opt/models');
const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;

    const exerciseId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims['cognito:username'];
    let exerciseForm = JSON.parse(event.body).exerciseForm;

    const User = (await mongooseModels(MONGODB_URI)).User;
    const Exercise = (await mongooseModels(MONGODB_URI)).Exercise;
    
    // First pull exercise data from user to ensure user has access verification.
    const userResult = (await User.find(
        {
            "username": username
        },
        {
            "exerciseReferences": {
                "$elemMatch": {
                    "_id": exerciseId,
                    "isFollow": false
                }
            }
        }
    ).exec().catch(err => {
        const errorResponse = "Error getting exercise from user: " + username + " : " + exerciseId + ". " + (err.message || JSON.stringify(err));

        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ success: false, message: errorResponse }),
        };
        
        return response;
    }))[0].exerciseReferences[0];
    
    console.log("User:", username, ", Exercise Id:", exerciseId, ", Result:", userResult);

    if (!userResult) {
        const errorResponse = "Exercise " + exerciseId + " not found for user: " + username + ".";

        const response = {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: errorResponse }),
        };
        
        return response;
    }
    
    const result = await Exercise.findByIdAndUpdate(exerciseId, exerciseForm, { runValidators: true }).exec().catch(err => {
        const errorResponse = "Error updating exercise : " + exerciseId + " : " + JSON.stringify(exerciseForm) + ". " + (err.message || JSON.stringify(err));

        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: errorResponse }),
        };
        
        return response;
    });

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify(JSON.stringify({ data: userResult })),
    };

    return response;
}