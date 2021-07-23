const mongooseModels = require('/opt/models');
const MONGODB_URI = process.env.MONGODB_URI;
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the exerciseResults to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;

    let templateForm = JSON.parse(event.body).templateForm;

    const User = (await mongooseModels(MONGODB_URI)).User;
    const Template = (await mongooseModels(MONGODB_URI)).Template;

    let fields = 'username';
    const user = await User.findOne({ username: event.requestContext.authorizer.claims['cognito:username'] }, fields).exec();

    if (!user) {
        const errorResponse = "Error finding user: " + event.requestContext.authorizer.claims['cognito:username'] + ".\n" + JSON.stringify(event.requestContext.authorizer);

        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ success: false, message: errorResponse}),
        }

        return response;
    }

    const userReference = {
        userId: ObjectId(user._id),
        username: user.username
    }

    const template = new Template({
        createdBy: userReference,
        description: templateForm.description,
        difficulty: templateForm.difficulty,
        exerciseReferences: templateForm.exercises,
        muscleGroups: templateForm.muscleGroups,
        name: templateForm.name,
        tags: templateForm.tags
    })

    const templateResult = await template.save().catch(err => {
        const errorResponse = "Error creating template: " + JSON.stringify(err);
        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ success:false, message: errorResponse }),
        }

        return response;
    })

    const userTemplate = {
        templateId: ObjectId(templateResult._id),
        name: templateResult.name,
        muscleGroups: templateResult.muscleGroups,
        tags: templateResult.tags,
        isFollow: false
    }

    const userResult = await User.updateOne({ _id: user._id }, { $push: { templateReferences: userTemplate }}).catch(err => {
        // TODO: Delete previous template
        const errorResponse = "Error creating template in user document: " + JSON.stringify(err);
        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ success: false, message: errorResponse }),
        }

        return response;
    })

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify({ success: true, _id: templateResult._id }),
    }

    return response;
}