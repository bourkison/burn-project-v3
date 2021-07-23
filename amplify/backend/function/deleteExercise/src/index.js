const mongoose = require('mongoose');
const mongooseModels = require('/opt/models');
const ObjectId = mongoose.Types.ObjectId;
const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;

    const exerciseId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims['cognito:username'];

    const User = (await mongooseModels(MONGODB_URI)).User;
    const Exercise = (await mongooseModels(MONGODB_URI)).Exercise;

    console.log("USER:", User);

    const userResult = (await User.find(
        {
            "username": username
        },
        {
            "exerciseReferences": {
                "$elemMatch": {
                    "exerciseId": exerciseId,
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
            body: JSON.stringify({ message: errorResponse }),
        };
        
        return response;
    }))[0].exerciseReferences[0];

    if (!userResult) {
        const errorResponse = "Exercise not found for user: " + username + ".";

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

    const exerciseResult = (await Exercise.findById(exerciseId, { "follows": 1 })).follows;
    let userPullPromises = [];
    
    exerciseResult.forEach(follow => {
        const userId = ObjectId(follow.get('userId'))
        
        console.log("USER ID:", userId);
        console.log("EXERCISE ID:", exerciseId);
        
        const query = User.updateOne({ "_id": userId }, {
            "$pull": {
                'exerciseReferences': {
                    "exerciseId": exerciseId
                }
            }
        })
        
        userPullPromises.push(query.exec());
    })
    
    await Promise.all(userPullPromises)
    const result = await Exercise.findById(exerciseId).deleteOne();

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify({ acknowledged: true, response: result })
    };

    return response;

}