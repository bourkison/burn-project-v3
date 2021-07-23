const mongooseModels = require('/opt/models');
const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;

    const templateId = event.pathParameters.proxy;
    const Template = (await mongooseModels(MONGODB_URI)).Template;

    let fields = 'createdBy description difficulty exerciseReferences muscleGroups name tags'
    const result = await Template.findOne({ _id: templateId }, fields).exec();

    if (!result) {
        const errorResponse = "Template: " + templateId + " not found." + JSON.stringify(event);

        const response = {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ success: false, message: errorResponse }),
        };
        
        return response;
    }

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify(JSON.stringify({ success: true, data: result })),
    }

    return response;
}