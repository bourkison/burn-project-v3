const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
let MONGODB_URI;

// GET request.
const getSearch = async function(event) {
    const query = event.queryStringParameters.q || "";
    const collections = event.queryStringParameters.collections ? event.queryStringParameters.collections.split(",") : ["exercise","template","user"];

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    }

    if (!query.trim()) {
        response.statusCode = 400;
        response.body = JSON.stringify({
            success: false,
            errorMessage: "Must send through a valid query"
        })
    }

    let responseData = {};
    let queryPromises = [];
    collections.forEach(collection => {
        queryPromises.push(queryCollection(query, collection));
    })

    const responses = await Promise.all(queryPromises)

    responses.forEach((response, index) => {
        console.log("RESPONSE:", response)
        responseData[collections[index]] = response;
    })

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: responseData
    });
    
    return response;
}

const queryCollection = async (query, collection) => {
    let Model;
    switch (collection) {
        case "exercise":
            Model = (await MongooseModels(MONGODB_URI)).Exercise;
            break;
        case "template":
            Model = (await MongooseModels(MONGODB_URI)).Template;
            break;
        case "user":
            Model = (await MongooseModels(MONGODB_URI)).User;
            break;
    }

    return Model.find({ $text: { $search: query } });
}

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;
    let response;

    const { Parameters } = await (new aws.SSM())
    .getParameters({
        Names: ["MONGODB_URI"].map(secretName => process.env[secretName]),
        WithDecryption: true,
    })
    .promise();

    MONGODB_URI = Parameters[0].Value;

    switch (event.httpMethod) {
        case "GET":
            response = getSearch(event);
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
