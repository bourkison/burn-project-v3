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
}

const getRecentWorkouts = async function(event) {
    let startDate = event.queryStringParameters.startDate;
    let endDate = event.queryStringParameters.endDate;
    let username = event.queryStringParameters.username;

    startDate = isNaN(Number(startDate)) ? new Date(startDate) : new Date(Number(startDate));
    endDate = isNaN(Number(endDate)) ? new Date(endDate) : new Date(Number(endDate));

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    }

    const User = (await MongooseModels(MONGODB_URI)).User;

    let workoutResult = (await User.aggregate([
        {
            $match: { username: username }
        },
        {
            $project: {
                workouts: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$workouts",
                                as: "w",
                                cond: {
                                    $and: [
                                        { $gte: [ "$$w.createdAt", startDate ] },
                                        { $lte: [ "$$w.createdAt", endDate ] }
                                    ]
                                }
                            }
                        },
                        as: "w",
                        in: {
                            "createdAt": "$$w.createdAt"
                        }
                    }
                }
            }
        }
    ]))[0];

    if (!workoutResult) {
        const errorResponse = "Comments not found for username: " + username
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        })

        return response;
    }

    workoutResult = workoutResult.workouts;

    // Data is object with date as key and amount in that date as value.
    let responseData = {};
    workoutResult.forEach(workout => {
        // Convert to yyyy-mm-dd
        let d = new Date(workout.createdAt);
        let mm = d.getMonth() + 1;
        let dd = d.getDate();

        let s = [d.getFullYear(), ( mm > 9 ? '' : '0' ) + mm, ( dd > 9 ? '' : '0' ) + dd].join("-");

        responseData[s] = responseData[s] ? responseData[s] + 1 : 1
    })

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: responseData
    })

    return response;
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
            response = await getStats(event);
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
