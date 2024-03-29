const aws = require("aws-sdk");
const MongooseModels = require("/opt/nodejs/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /comment/{proxy+}
const queryComment = async function(event) {
    const docId = ObjectId(event.pathParameters.proxy);
    const coll = event.queryStringParameters.coll;
    const loadAmount = 0 - Number(event.queryStringParameters.loadAmount);
    const username = event.requestContext.authorizer.claims["cognito:username"];

    console.log("MONGODB_URI", MONGODB_URI);
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

    let aggregateProjectionFirst = {
        $project: {
            comments: {
                $slice: ["$comments", loadAmount]
            }
        }
    }

    let aggregateProjectionSecond = {
        $project: {
            comments: {
                $map: {
                    input: "$comments",
                    as: "c",
                    in: {
                        _id: "$$c._id",
                        docId: "$$c.docId",
                        content: "$$c.content",
                        likeCount: "$$c.likeCount",
                        createdAt: "$$c.createdAt",
                        updatedAt: "$$c.updatedAt",
                        createdBy: "$$c.createdBy",
                        isLiked: {
                            $anyElementTrue: [
                                {
                                    $map: {
                                        input: "$$c.likes",
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
                        },
                        likes: []
                    }
                }
            }
        }
    }

    // Get comment count if coll !== user.
    if (coll !== "user") {
        aggregateProjectionFirst.$project.commentCount = 1;
        aggregateProjectionSecond.$project.commentCount = 1;
    }

    // First pull comment amount from collection.
    // Instead of pulling all likes, will just pull true/false based on if user has liked.
    const commentResult = (
        await Model.aggregate([
            {
                $match: {
                    _id: docId
                }
            },
            aggregateProjectionFirst,
            aggregateProjectionSecond
        ])
    )[0];

    if (!commentResult) {
        const errorResponse =
            "Comments not found for id: " +
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

    let responseData = {
        comments: commentResult.comments.reverse()
    }

    if (coll !== "user") {
        responseData.commentCount = commentResult.commentCount;
    }

    
    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: responseData
    });

    return response;
};

// POST request /comment
const createComment = async function(event) {
    const docId = ObjectId(event.queryStringParameters.docId);
    const coll = event.queryStringParameters.coll;
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const content = JSON.parse(event.body).content;
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
        default:
            response.statusCode = 400;
            response.body = "Incorrect collection provided";
            return response;
    }

    // First get the user for the docId.
    let fields = "username";
    const user = await User.findOne({ username: username }, fields).exec();

    // Next push the comment to the relevant document's comments array and increment comment count by 1.
    const userReference = {
        userId: ObjectId(user._id),
        username: username
    };

    const comment = {
        content: content,
        createdBy: userReference,
        _id: _id
    };

    const collResult = await Model.updateOne(
        {
            _id: docId
        },
        {
            $push: {
                comments: comment
            },
            $inc: {
                commentCount: 1
            }
        }
    );

    if (!collResult) {
        const errorResponse = "No comment created in collection.";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
        return response;
    }

    // Next push the comment reference to the user's comments array.
    const commentReference = {
        coll: coll,
        docId: docId,
        _id: _id
    };

    const userResult = await User.updateOne(
        {
            username: username
        },
        {
            $push: {
                comments: commentReference
            }
        }
    );

    if (!userResult) {
        const errorResponse = "No comment created in user.";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: { _id: _id } });

    return response;
};

// DELETE request /comment
const deleteComment = async function(event) {
    const docId = ObjectId(event.queryStringParameters.docId);
    const coll = event.queryStringParameters.coll;
    const _id = ObjectId(event.queryStringParameters._id);
    const username = event.requestContext.authorizer.claims["cognito:username"];

    let Model;

    const User = await MongooseModels().User(MONGODB_URI);

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
        default:
            response.statusCode = 400;
            response.body = "Incorrect collection provided";
            return response;
    }

    // First get the comment to ensure user created it.
    const userCheck = (
        await User.findOne(
            {
                username: username
            },
            {
                comments: {
                    $elemMatch: {
                        _id: _id,
                        coll: coll,
                        docId: docId
                    }
                }
            }
        )
            .exec()
            .catch(err => {
                const errorResponse =
                    "Error getting comment: " +
                    _id +
                    " from doc: " +
                    docId +
                    " from coll: " +
                    coll +
                    " ." +
                    (err.message || JSON.stringify(err));
                response.body = JSON.stringify({
                    success: false,
                    errorMessage: errorResponse
                });

                return response;
            })
    ).comments[0];

    if (!userCheck) {
        const errorResponse =
            "Comment: " + _id + " not found for user: " + username + ".";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Next delete all like references from each like.
    const likesResult = (
        await Model.findOne(
            {
                _id: docId
            },
            {
                comments: {
                    $elemMatch: {
                        _id: _id
                    }
                }
            }
        ).exec()
    ).comments[0].likes;
    let userLikesPullPromises = [];

    console.log("LIKES RESULT:", likesResult);

    likesResult.forEach(like => {
        const userId = ObjectId(like.createdBy.userId);

        console.log("USER ID:", userId);
        console.log("LIKE ID:", like._id);
        console.log("COMMENT ID:", _id);

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    likes: {
                        _id: like._id,
                        commentId: _id
                    }
                }
            }
        );

        userLikesPullPromises.push(query.exec());
    });

    await Promise.all(userLikesPullPromises);

    // Now pull comment from the collection's comments array.
    const collResult = await Model.updateOne(
        {
            _id: docId
        },
        {
            $pull: {
                comments: {
                    _id: _id,
                    "createdBy.username": username
                }
            },
            $inc: {
                commentCount: -1
            }
        }
    );

    if (!collResult) {
        const errorResponse = "Couldn't delete comment from collection";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Now pull the commentReference from the user's comments array.
    const userResult = await User.updateOne(
        {
            username: username
        },
        {
            $pull: {
                comments: {
                    _id: _id,
                    docId: docId,
                    coll: coll
                }
            }
        }
    );

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
            response = queryComment(event);
            break;
        case "POST":
            response = createComment(event);
            break;
        case "DELETE":
            response = deleteComment(event);
            break;
        default:
            response = {
                statusCode: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
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
