const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const mongooseModels = require('/opt/models');
const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;

    const templateId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims['cognito:username'];
    let templateForm = JSON.parse(event.body).templateForm;

    const User = (await mongooseModels(MONGODB_URI)).User;
    const Template = (await mongooseModels(MONGODB_URI)).Template;

    // First pull template data to ensure user created this and has access to edit.
    const userResult = (await User.find(
        {
            "username": username
        },
        {
            "templateReferences": {
                "$elemMatch": {
                    "templateId": templateId,
                    "isFollow": false
                }
            }
        }
    ).exec().catch(err => {
        const errorResponse = "Error getting template from user: " + username + " : " + templateId + ". " + (err.message || JSON.stringify(err));

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
    }))[0].templateReferences[0];

    if (!userResult) {
        const errorResponse = "Template " + templateId + " not found for user " + username + ".";
    
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

    const result = await Template.findByIdAndUpdate(templateId, templateForm, { runValidators: true }).exec().catch(err => {
        const errorResponse = "Error updating template : " + templateId + " : " + JSON.stringify(templateForm) + ". " + (err.message || JSON.stringify(err));

        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ success: false,message: errorResponse }),
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
        body: JSON.stringify({ success: true, data: result }),
    }

    return response;
}