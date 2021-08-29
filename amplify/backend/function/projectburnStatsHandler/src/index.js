const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
let MONGODB_URI;

// GET request /stats
const getStats = async function(event) {
    let response;

    switch (event.pathParameters.proxy) {
        case "recentWorkouts":
            response = await getRecentWorkouts(event);
            break;
    }

    return response;
}

const getRecentWorkouts = async function(event) {
    let startDate = event.queryStringParameters.startDate;
    let endDate = event.queryStringParameters.endDate;

    const User = (await MongooseModels(MONGODB_URI)).User;

    
}

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;
    let response;

    const { Parameters } = await new aws.SSM()
        .getParameters({
            Names: ["MONGODB_URI"].map(secretName => process.env[secretName]),
            WithDecryption: true
        })
        .promise();

    MONGODB_URI = Parameters[0].Value;

    switch (event.httpMethod) {
        case "GET":
            await getStats(event);
            break;
        default:
            response = {
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    success: false,
                    errorMessage: "Method does not exist."
                })
            };
            break;
    }

    return response;
};
