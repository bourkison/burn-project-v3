const aws = require("aws-sdk");
const MongooseModels = require("/opt/nodejs/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /like/{proxy+}
const getLike = async function(event) {
    const docId = ObjectId(event.pathParameters.proxy);
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
            Model = await MongooseModels().Exercise(MONGODB_URI);
            break;
        case "template":
            Model = await MongooseModels().Template(MONGODB_URI);
            break;
        case "post":
            Model = await MongooseModels().Post(MONGODB_URI);
            break;
        case "user":
            Model = await MongooseModels().User(MONGODB_URI);
            break;
        default:
            response.statusCode = 400;
            response.body = "Incorrect collection provided";
            return response;
    }

    let findProjection = {
        likes: {
            $slice: [ "$likes", 0 - loadAmount ]
        }
    };

    // Only get like count if we're not getting user likes.
    if (coll !== "user") {
        findProjection.likeCount = 1;
    }

    const likeResult = (await Model.findOne({ _id: docId }, findProjection));

    if (!likeResult) {
        const errorResponse =
        "Likes not found for id: " +
        docId +
        " in collection: " +
        coll +
        ".";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: { likeCount: likeResult.likeCount, likes: likeResult.likes }
    });

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

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let Model;
    const User = await MongooseModels().User(MONGODB_URI);

    switch (coll.split("/")[0]) {
        case "exercise":
            Model = await MongooseModels().Exercise(MONGODB_URI);
            break;
        case "template":
            Model = await MongooseModels().Template(MONGODB_URI);
            break;
        case "post":
            Model = await MongooseModels().Post(MONGODB_URI);
            break;
        default:
            response.statusCode = 400;
            response.body = JSON.stringify({ success: false, errorMessage: "Incorrect collection provided"});
            return response;
    }

    // TODO: A lot of these promises could be done asynchronously
    // With a Promise.all() to catch them.

    // First get the user for the _id.
    let promises = [];
    let user;
    let fields = "username";
    promises.push(User.findOne({ username: username }, fields).exec().then(response => { user = response; }));

    // Check if user has liked already.
    // TODO: This is all messy and needs to be cleaned.
    let likeCheckResult;
    console.log("COMMENT ID:", commentId);

    if (!commentId) {
        console.log("NO COMMENT ID");
        promises.push(Model.aggregate([
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
        ])
        .then(response => {
            likeCheckResult = response;
        }));

        if (likeCheckResult.length > 0) {
            likeCheckResult = likeCheckResult[0].isLiked;
        } else {
            likeCheckResult = false;
        }
    } else {
        try {
            promises.push(Model.aggregate([
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
            ])
            .then(response => {
                likeCheckResult = response;
            }));

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

    await Promise.all(promises);

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
    const User = await MongooseModels().User(MONGODB_URI);

    switch (coll.split("/")[0]) {
        case "exercise":
            Model = await MongooseModels().Exercise(MONGODB_URI);
            break;
        case "template":
            Model = await MongooseModels().Template(MONGODB_URI);
            break;
        case "post":
            Model = await MongooseModels().Post(MONGODB_URI);
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
            response = await getLike(event);
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
