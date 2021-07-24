const aws = require('aws-sdk');
const MongooseModels = require('/opt/models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /comment
const queryComment = async function(event) {
    const _id = ObjectId(event.queryStringParameters._id);
    const coll = event.queryStringParameters.coll;
    const loadAmount = 0 - Number(event.queryStringParameters.loadAmount);
    const username = event.requestContext.authorizer.claims['cognito:username'];

    let Model;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    }

    switch (coll) {
        case "exercise":
            Model = (await MongooseModels(MONGODB_URI)).Exercise;
            break;
        case "template":
            Model = (await MongooseModels(MONGODB_URI)).Template;
            break;
        case "post":
            Model = (await MongooseModels(MONGODB_URI)).Post;
            break;
        case "user":
            Model = (await MongooseModels(MONGODB_URI)).User;
            break;
        default:
            response.statusCode = 400;
            response.body = "Incorrect collection provided";
            return response;
    }

    // First pull comment amount from collection.
    // Instead of pulling all likes, will just pull true/false based on if user has liked.
    const comments = (await Model.aggregate([
        {
            "$match": {
                "_id": _id
            }
        },
        {
            "$project": {
                "comments": {
                    "$slice": [ "$comments", loadAmount ]
                }
            }
        },
        {
            "$project": {
                "comments.content": 1,
                "comments.likeCount": 1,
                "comments.createdAt": 1,
                "comments.updatedAt": 1,
                "comments.createdBy": 1,
                "comments.likes": {
                    "$eq": [ "$comments.likes.createdAt.username", username ]
                }
            }
        }
    ]))[0].comments.reverse();

    if (!comments) {
        const errorResponse = "Comments not found for id: " + _id + " in collection: " + coll + ".";
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });

        return response;
    }

    comments.forEach(comment => {
        comment.isLiked = comment.likes;
        comment.likes = [];
    })

    // We only need to return commentCount if we are pulling from a collection.
    if (coll !== "user") {
        // First pull commentCount from collection.
        let fields = 'commentCount';
        const commentCount = (await Model.findOne({ "_id": _id }, fields).exec()).commentCount;

        if (isNaN(commentCount)) {
            const errorResponse = "Id: " + _id + " for collection: " + coll + " commentCount not found." 
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            
            return response;
        }

        response.statusCode = 200;
        response.body = JSON.stringify({ success: true, data: { comments: comments, commentCount: commentCount }})
    } else {
        response.statusCode = 200;
        response.body = JSON.stringify({ success: true, data: { comments: comments }})
    }

    return response;
}

// POST request /comment
const createComment = async function(event) {
    const _id = ObjectId(event.queryStringParameters._id);
    const coll = event.queryStringParameters.coll;
    const username = event.requestContext.authorizer.claims['cognito:username'];
    const content = JSON.parse(event.body).content;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    }
    
    let Model;
    const User = (await MongooseModels(MONGODB_URI)).User;

    switch (coll) {
        case "exercise":
            Model = (await MongooseModels(MONGODB_URI)).Exercise;
            break;
        case "template":
            Model = (await MongooseModels(MONGODB_URI)).Template;
            break;
        case "post":
            Model = (await MongooseModels(MONGODB_URI)).Post;
            break;
        default:
            response.statusCode = 400;
            response.body = "Incorrect collection provided";
            return response;
    }

    // First get the user for the _id.
    let fields = 'username';
    const user = await User.findOne({ username: username }, fields).exec();

    // Next push the comment to the relevant document's comments array and increment comment count by 1.
    const userReference = {
        userId: ObjectId(user._id),
        username: username
    }

    const comment = {
        content: content,
        createdBy: userReference
    }

    const collResult = await Model.updateOne(
        {
            "_id": _id
        },
        {
            "$push": {
                "comments": comment
            },
            "$inc": {
                "commentCount": 1
            }
        }
    );

    if (!collResult) {
        const errorResponse = "No comment created in collection.";
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
        return response;
    }

    // Next push the comment reference to the user's comments array.
    const commentReference = {
        coll: coll,
        _id: _id
    }

    const userResult = await User.updateOne(
        {
            "username": username
        },
        {
            "$push": {
                "comments": commentReference
            }
        }
    );

    if (!userResult) {
        const errorResponse = "No comment created in user."
        request.body = JSON.stringify({ success: false, errorMessage: errorResponse });
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: comment, userData: commentReference });

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
            response = queryComment(event);
            break;
        case "POST":
            response = createComment(event);
            break;
        default:
            response = {
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                }, 
                body: JSON.stringify({ success: false, errorMessage: "Method does not exist." }),
            }
            break;
    }

    return response;
};
