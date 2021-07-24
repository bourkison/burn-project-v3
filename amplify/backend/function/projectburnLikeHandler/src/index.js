const aws = require('aws-sdk');
const MongooseModels = require('/opt/models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /like
const queryLike = async function(event) {
    const _id = ObjectId(event.queryStringParameters._id);
    const coll = event.queryStringParameters.coll;
    const loadAmount = 0 - Number(event.queryStringParameters.loadAmount);
    
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

    // First pull load amount likes from collection.
    const likes = (await Model.aggregate([
        {
            "$match": {
                "_id": _id
            }
        },
        {
            "$project": {
                "likes": {
                    "$slice": [ "$likes", loadAmount ]
                }
            }
        }
    ]))[0].likes;

    if (!likes) {
        const errorResponse = "Likes not found for id: " + _id +  " in collection: " + coll + "."
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
        
        return response;
    }

    // We only need to return likeCount and isLiked if we are pulling from a collection.
    if (coll !== "user") {
        // First pull likeCount from collection.
        let fields = 'likeCount'
        const likeCount = (await Model.findOne({ "_id": _id }, fields).exec()).likeCount;

        if (isNaN(likeCount)) {
            const errorResponse = "Id: " + _id + " for collection: " + coll + " likeCount not found." 
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            
            return response;
        }

        // Now we check to see if the user has like this document.
        let isLiked = false;
        const username = event.requestContext.authorizer.claims['cognito:username'];

        const userResult = (await Model.findOne(
            {
                "_id": _id
            },
            {
                "likes": {
                    "$elemMatch": {
                        "createdBy.username": username
                    }
                }
            }
        )).likes

        if (userResult.length > 0) {
            isLiked = true;
        }

        response.statusCode = 200;
        response.body = JSON.stringify({ success: true, data: { likeCount: likeCount, likes: likes, isLiked: isLiked } })
    } else {
        // TODO: Pull the comment data from the relevant collections.
        response.statusCode = 200;
        response.body = JSON.stringify({ success: true, data: { likes: likes } })
    }


    return response;
}

// POST request /like
const createLike = async function(event) {
    const _id = ObjectId(event.queryStringParameters._id);
    const coll = event.queryStringParameters.coll;
    const username = event.requestContext.authorizer.claims['cognito:username'];

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

    // TODO: A lot of these promises could be done asynchronously
    // With a Promise.all() to catch them.

    // First get the user for the _id. 
    let fields = 'username'
    const user = await User.findOne({ username: username }, fields).exec();

    // Next push the like to the relevant document's likes array and increment likeCount by 1.
    const userReference = {
        userId: ObjectId(user._id),
        username: username
    }
    
    const like = {
        createdBy: userReference
    }

    const collResult = await Model.updateOne(
        {
            "_id": _id
        },
        {
            "$push": {
                "likes": like
            },
            "$inc": {
                "likeCount": 1
            }
        }
    );

    if (!collResult) {
        const errorResponse = "No like created in collection.";
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
        return response;
    }

    // Next push the likes reference to the user's likes array.
    const likeReference = {
        coll: coll,
        _id: _id
    }

    const userResult = await User.updateOne(
        {
            "username": username
        },
        {
            "$push": {
                "likes": likeReference
            }
        }
    );
    
    console.log(userResult)

    if (!userResult) {
        const errorResponse = "No like created in user.";
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });

        return response;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: collResult, userData: userResult });
    
    return response;
}

// DELETE request /like
const deleteLike = async function(event) {
    const _id = ObjectId(event.queryStringParameters._id);
    const coll = event.queryStringParameters.coll;
    const username = event.requestContext.authorizer.claims['cognito:username'];

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

    // First get user for the _id.
    let fields = 'username'
    const user = await User.findOne({ username: username }, fields).exec();

    // Next pull user reference from relevant document's likes array and increment likeCount by -1.
    const collResult = await Model.updateOne(
        {
            "_id": _id
        },
        {
            "$pull": {
                "likes": {
                    "createdBy.userId": ObjectId(user._id)
                }
            },
            "$inc": {
                "likeCount": -1
            }
        }
    );

    if (!collResult) {
        const errorResponse = "Couldn't delete like from collection";
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });

        return response;
    }

    // Next pull the likeReference from the user's likes array.
    const userResult = await User.updateOne(
        {
            "username": username
        },
        {
            "$pull": {
                "likes": {
                    "_id": _id
                }
            }
        }
    );

    if (!userResult) {
        const errorResponse = "Error deleting like in user: ";
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });

        return response;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: collResult, userData: userResult });

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
            response = await queryLike(event);
            break;
        case "POST":
            response = await createLike(event);
            break;
        case "DELETE":
            response = await deleteLike(event);
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
