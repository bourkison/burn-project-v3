const aws = require('aws-sdk');
const MongooseModels = require('/opt/models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /template/{proxy+}
const getTemplate = async function(event) {
    const templateId = event.pathParameters.proxy;
    const Template = (await MongooseModels(MONGODB_URI)).Template;

    let fields = 'createdBy description difficulty exerciseReferences muscleGroups name tags'
    const result = await Template.findOne({ _id: templateId }, fields).exec();

    if (!result) {
        const errorResponse = "Exercise: " + exerciseId + " not found." + JSON.stringify(event);

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
    }

    return response;
}

// GET request /template
const queryTemplate = async function(event) {
    const username = event.requestContext.authorizer.claims['cognito:username'];
    const loadAmount = 0 - Number(event.queryStringParameters.loadAmount);
    
    const User = (await MongooseModels(MONGODB_URI)).User;

    // Pull loadAmount elements from templaterefs
    const userResult = (await User.aggregate([
        {
            "$match": {
                "username": username
            }
        },
        {
            "$project": {
                "templateReferences": {
                    "$slice": [ "$templateReferences", loadAmount ]
                }
            }
        }
    ]))[0].templateReferences.reverse();

    console.log(userResult);

    if (!userResult) {
        const errorResponse = "Templates not found for user: " + username + ".";

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
        body: JSON.stringify(JSON.stringify({ success: true, data: userResult })),
    };

    return response;
}

// POST request
const createTemplate = async function(event) {
    let templateForm = JSON.parse(event.body).templateForm;

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Template = (await MongooseModels(MONGODB_URI)).Template;

    let fields = 'username';
    const user = await User.findOne({ username: event.requestContext.authorizer.claims['cognito:username'] }, fields).exec();

    if (!user) {
        const errorResponse = "Error finding user: " + event.requestContext.authorizer.claims['cognito:username'] + ".\n" + JSON.stringify(event.requestContext.authorizer);

        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "*",
                "Access-Control-Allow-Origin": "*"
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
                "Access-Control-Allow-Headers" : "*",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ success:false, message: errorResponse }),
        }

        return response;
    })

    const templateReference = {
        templateId: ObjectId(templateResult._id),
        name: templateResult.name,
        muscleGroups: templateResult.muscleGroups,
        tags: templateResult.tags,
        isFollow: false
    }

    const userResult = await User.updateOne({ _id: user._id }, { $push: { templateReferences: templateReference }}).catch(err => {
        // TODO: Delete previous template
        const errorResponse = "Error creating template in user document: " + JSON.stringify(err);
        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "*",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ success: false, message: errorResponse }),
        }

        return response;
    })

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: true, _id: templateResult._id, data: templateResult }),
    }

    return response;
}

// PUT request
const updateTemplate = async function(event) {
    const templateId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims['cognito:username'];
    let templateForm = JSON.parse(event.body).templateForm;

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Template = (await MongooseModels(MONGODB_URI)).Template;

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
                "Access-Control-Allow-Headers" : "*",
                "Access-Control-Allow-Origin": "*"
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
                "Access-Control-Allow-Headers" : "*",
                "Access-Control-Allow-Origin": "*"
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
                "Access-Control-Allow-Headers" : "*",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ success: false,message: errorResponse }),
        };
        
        return response;
    });

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: true, data: result }),
    }

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
            if (event.resource === "/exercise") {
                response = await queryTemplate(event);
            } else {
                response = await getTemplate(event);
            }
            break;
        case "POST":
            response = await createTemplate(event);
            break;
        case "PUT":
            response = await updateTemplate(event);
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
