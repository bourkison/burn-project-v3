const aws = require('aws-sdk');
const MongooseModels = require('/opt/models');
let MONGODB_URI;

// GET request.
const getUser = async function(event) {
    let username = event.pathParameters.proxy;
    const User = (await MongooseModels(MONGODB_URI)).User;

    let fields = 'username email firstName surname gender dob height weight country metric';
    const result = await User.findOne({ username: username }, fields).exec();

    if (!result) {
        const errorResponse = "User: " + username + " not found." + JSON.stringify(event);

        const response = {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Headers" : "*",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ success: false, message: errorResponse }),
        };
        
        return response;
    }

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: true, data: result }),
    };

    return response;
}

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;
    let response;

    const { Parameters } = await ((new aws.SSM())
    .getParameters({
        Names: ["MONGODB_URI"].map(secretName => process.env[secretName]),
        WithDecryption: true,
    })
    .promise());
    
    MONGODB_URI = Parameters[0].Value;

    switch (event.httpMethod) {
        case "GET":
            response = await getUser(event);
            break;
        default:
            response = {
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Headers" : "*",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({ success: false, errorMessage: "Method does not exist." }),
            }
            break;
    }

    return response;
};
