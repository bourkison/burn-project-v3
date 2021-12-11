const aws = require('aws-sdk');
const MongooseModels = require("/opt/nodejs/models");
let MONGODB_URI;

// GET request /exercise/{proxy+}
const getExercise = async function(event) {
    const exerciseId = ObjectId(event.pathParameters.proxy.split("/")[1]);
    const Exercise = await MongooseModels().Exercise(MONGODB_URI);

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let findProjection = {
        createdBy: 1,
        description: 1,
        difficulty: 1,
        filePaths: 1,
        measureBy: 1,
        muscleGroups: 1,
        name: 1,
        tags: 1
    };

    const result = await Exercise.findOne({ _id: exerciseId }, findProjection).exec();

    if (!result) {
        const errorResponse =
            "Exercise: " + exerciseId + " not found." + JSON.stringify(event);
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    let responseData = {
        _id: result._id,
        createdBy: result.createdBy,
        description: result.description,
        difficulty: result.difficulty,
        filePaths: result.filePaths,
        measureBy: result.measureBy,
        muscleGroups: result.muscleGroups,
        name: result.name,
        tags: result.tags,
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: responseData });

    return response;
};

exports.handler = async (event) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;
    let response = {
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

    const { Parameters } = await (new aws.SSM())
    .getParameters({
        Names: ["MONGODB_URI"].map(secretName => process.env[secretName]),
        WithDecryption: true,
    })
    .promise();

    if (event.httpMethod !== "GET") {
        return response;
    }

    let type = event.pathParameters.proxy.split("/")[0];

    switch (type) {
        case "exercise":
            response = await getExercise(event)
            break;
        default:
            return response;
    }

    return response;
};
