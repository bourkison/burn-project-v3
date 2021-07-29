const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /like
const queryLike = async function(event) {
    const docId = ObjectId(event.queryStringParameters.docId);
    const coll = event.queryStringParameters.coll;
    const loadAmount = Number(event.queryStringParameters.loadAmount);

    let Model;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

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
    const likes = (await Model.findOne(
        {
            _id: docId
        },
        {
            likes: {
                $slice: [ "$likes", 0 - loadAmount ]
            }
        }
    )).likes

    if (!likes) {
        const errorResponse =
            "Likes not found for id: " +
            docId +
            " in collection: " +
            coll +
            ".";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // We only need to return likeCount and isLiked if we are pulling from a collection.
    if (coll !== "user") {
        // First pull likeCount from collection.
        const username = event.requestContext.authorizer.claims["cognito:username"];
        
        const likeResult = await Model.findOne(
            {
                _id: docId
            },
            {
                likeCount: 1,
                likes: {
                    $elemMatch: {
                        "createdBy.username": username
                    }
                }
            }
        );

        const likeCount = likeResult.likeCount;

        if (isNaN(likeCount)) {
            const errorResponse =
                "Id: " +
                docId +
                " for collection: " +
                coll +
                " likeCount not found.";
            response.statusCode = 404;
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            });

            return response;
        }

        const isLiked = (likeResult.likes && likeResult.likes.length) ? true : false;

        response.statusCode = 200;
        response.body = JSON.stringify({
            success: true,
            data: { likeCount: likeCount, likes: likes, isLiked: isLiked }
        });
    } else {
        // TODO: Pull the comment data from the relevant collections.
        response.statusCode = 200;
        response.body = JSON.stringify({
            success: true,
            data: { likes: likes }
        });
    }

    return response;
};

// POST request /like
const createLike = async function(event) {
    console.log("EVENT:", event);

    const docId = new ObjectId(event.queryStringParameters.docId);
    const coll = event.queryStringParameters.coll;
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const commentId = event.queryStringParameters.commentId
        ? new ObjectId(event.queryStringParameters.commentId)
        : null;
    const _id = new ObjectId();

    console.log(
        "ID:",
        docId,
        "COLL:",
        coll,
        "USERNAME:",
        username,
        "COMMENTID:",
        commentId
    );

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let Model;
    const User = (await MongooseModels(MONGODB_URI)).User;

    switch (coll.split("/")[0]) {
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
            response.body = JSON.stringify({ success: false, errorMessage: "Incorrect collection provided"});
            return response;
    }

    // TODO: A lot of these promises could be done asynchronously
    // With a Promise.all() to catch them.

    // First get the user for the _id.
    let fields = "username";
    const user = await User.findOne({ username: username }, fields).exec();

    // Check if user has liked already.
    // TODO: This is all messy and needs to be cleaned.
    let likeCheckResult;
    console.log("COMMENT ID:", commentId);

    if (!commentId) {
        console.log("NO COMMENT ID");
        likeCheckResult = await Model.aggregate([
            {
                $match: {
                    _id: docId
                }
            },
            {
                $project: {
                    isLiked: {
                        $anyElementTrue: [
                            {
                                $map: {
                                    input: "$likes",
                                    as: "l",
                                    in: {
                                        $eq: [
                                            "$$l.createdBy.username",
                                            username
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]);

        if (likeCheckResult.length > 0) {
            likeCheckResult = likeCheckResult[0].isLiked;
        } else {
            likeCheckResult = false;
        }
    } else {
        console.log("YES COMMENT ID");
        try {
            // THIS ONE FUCKING WOKRS IN BOTH MONGOSH AND MONGOPLAYGROUND BUT NOT HERE FOR WHATEVER STUPID REASON.
            // I SWEAR TO GOD I HAVE TRIPLE CHECKED VARIABLES BEING PASSED THROUGH.
            // db.templates.aggregate([{"$match": { "_id": ObjectId("60fc1e3d7a89130008bf0475") }}, { "$project": { "filteredComments": { "$arrayElemAt": [{ "$filter": {"input": "$comments", "as": "c", "cond": { "$eq": [ "$$c._id", ObjectId("60fd373389d9130008b4fe0c") ] } }}, 0] } }}, { "$project":  { "isLiked": { "$anyElementTrue": [ { "$map": { "input": "$filteredComments.likes", "as": "l", "in": { "$eq": [ "$$l.createdBy.username", "bourkison" ] } } } ] } } } ])

            // Apparently no changes detected.
            console.log("Trying this shit:", docId, commentId);
            likeCheckResult = await Model.aggregate([
                {
                    $match: {
                        _id: docId
                    }
                },
                {
                    $project: {
                        filteredComments: {
                            $arrayElemAt: [
                                {
                                    $filter: {
                                        input: "$comments",
                                        as: "c",
                                        cond: {
                                            $eq: ["$$c._id", commentId]
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    }
                },
                {
                    $project: {
                        isLiked: {
                            $anyElementTrue: [
                                {
                                    $map: {
                                        input: "$filteredComments.likes",
                                        as: "l",
                                        in: {
                                            $eq: [
                                                "$$l.createdBy.username",
                                                username
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            ]);

            likeCheckResult = likeCheckResult[0].isLiked;
        } catch (err) {
            console.error(err);
            const errorResponse =
                "Error checking DB for isLiked." +
                JSON.stringify(likeCheckResult);
            response.statusCode = 500;
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            });

            return response;
        }
    }

    console.log("LIKE CHECK RESULT:", likeCheckResult);

    if (likeCheckResult) {
        const errorResponse =
            "User has already liked this post: " +
            JSON.stringify(likeCheckResult);
        response.statusCode = 403;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    console.log("MADE IT PAST LIKE CHECK RESULT:", likeCheckResult);

    // Next push the like to the relevant document's likes array and increment likeCount by 1.
    const userReference = {
        userId: ObjectId(user._id),
        username: username
    };

    const like = {
        createdBy: userReference,
        _id: _id
    };

    let collResult;
    if (!commentId) {
        collResult = await Model.updateOne(
            {
                _id: docId
            },
            {
                $push: {
                    likes: like
                },
                $inc: {
                    likeCount: 1
                }
            }
        );
    } else {
        collResult = await Model.updateOne(
            {
                _id: docId,
                "comments._id": commentId
            },
            {
                $push: {
                    "comments.$.likes": like
                },
                $inc: {
                    "comments.$.likeCount": 1
                }
            }
        );
    }

    if (!collResult) {
        const errorResponse = "No like created in collection.";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
        return response;
    }

    // Next push the likes reference to the user's likes array.
    let likeReference = {
        coll: coll,
        docId: docId,
        commentId: commentId ? commentId : null,
        _id: _id
    };

    const userResult = await User.updateOne(
        {
            username: username
        },
        {
            $push: {
                likes: likeReference
            }
        }
    );

    console.log(userResult);

    if (!userResult) {
        const errorResponse = "No like created in user.";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: collResult,
        userData: userResult
    });

    return response;
};

// DELETE request /like
const deleteLike = async function(event) {
    const docId = ObjectId(event.queryStringParameters.docId);
    const coll = event.queryStringParameters.coll;
    const commentId = event.queryStringParameters.commentId
        ? ObjectId(event.queryStringParameters.commentId)
        : null;
    const username = event.requestContext.authorizer.claims["cognito:username"];

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let Model;
    const User = (await MongooseModels(MONGODB_URI)).User;

    switch (coll.split("/")[0]) {
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
    let fields = "username";
    const user = await User.findOne({ username: username }, fields).exec();

    // Next pull user reference from relevant document's likes array and increment likeCount by -1.
    let collResult;
    if (!commentId) {
        collResult = await Model.updateOne(
            {
                _id: docId
            },
            {
                $pull: {
                    likes: {
                        "createdBy.userId": ObjectId(user._id)
                    }
                },
                $inc: {
                    likeCount: -1
                }
            }
        );
    } else {
        collResult = await Model.updateOne(
            {
                _id: docId,
                "comments._id": commentId
            },
            {
                $pull: {
                    "comments.$.likes": {
                        "createdBy.username": username
                    }
                },
                $inc: {
                    "comments.$.likeCount": -1
                }
            }
        );
    }

    if (!collResult) {
        const errorResponse = "Couldn't delete like from collection";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Next pull the likeReference from the user's likes array.
    let userResult;
    if (!commentId) {
        userResult = await User.updateOne(
            {
                username: username
            },
            {
                $pull: {
                    likes: {
                        docId: docId,
                        commentId: null
                    }
                }
            }
        );
    } else {
        userResult = await User.updateOne(
            {
                username: username
            },
            {
                $pull: {
                    likes: {
                        docId: docId,
                        commentId: commentId
                    }
                }
            }
        );
    }

    if (!userResult) {
        const errorResponse = "Error deleting like in user.";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: collResult,
        userData: userResult
    });

    return response;
};

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
