/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STORAGE_PROJECTBURNSTORAGE_BUCKETNAME
Amplify Params - DO NOT EDIT */
const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /post/{proxy+}
const getPost = async function(event) {
    const postId = event.pathParameters.proxy;
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const Post = (await MongooseModels(MONGODB_URI)).Post;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    const result = await Post.findOne(
        {
            _id: postId
        },
        {
            content: 1,
            filePaths: 1,
            share: 1,
            createdBy: 1,
            createdAt: 1,
            likeCount: 1,
            likes: {
                $elemMatch: {
                    "createdBy.username": username
                }
            },
            commentCount: 1
        }
    ).exec();

    if (!result) {
        const errorResponse = "Post: " + postId + " not found.";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    const isLiked = result.likes && result.likes.length ? true : false;

    const responseData = {
        _id: result._id,
        content: result.content,
        filePaths: result.filePaths,
        share: result.share,
        createdAt: result.createdAt,
        createdBy: result.createdBy,
        likeCount: result.likeCount,
        commentCount: result.commentCount,
        isLiked: isLiked
    };

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: responseData
    });

    return response;
};

// GET request /post
const queryPost = async function(event) {
    const loadAmount = event.queryStringParameters.loadAmount
        ? Number(event.queryStringParameters.loadAmount)
        : 5;
    const userId =
        event.queryStringParameters && event.queryStringParameters.userId
            ? ObjectId(event.queryStringParameters.userId)
            : null;
    const startAt = event.queryStringParameters.startAt;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let result;
    const User = (await MongooseModels(MONGODB_URI)).User;

    if (userId) {
        if (!startAt) {
            result = await User.findOne(
                {
                    _id: userId
                },
                {
                    postReferences: {
                        $slice: ["$postReferences", 0 - loadAmount]
                    }
                }
            );
        } else {
            result = (
                await User.aggregate([
                    {
                        $match: {
                            _id: userId
                        }
                    },
                    {
                        $project: {
                            postReferences: 1,
                            startAtIndex: {
                                $indexOfArray: ["$postReferences._id", ObjectId(startAt)]
                            }
                        }
                    },
                    {
                        $project: {
                            postReferences: 1,
                            actualLoadAmount: {
                                $cond: [
                                    { $lt: ["$startAtIndex", loadAmount] },
                                    "$startAtIndex",
                                    loadAmount
                                ]
                            },
                            startAtIndex: {
                                $cond: [
                                    {
                                        $lte: [{ $subtract: ["$startAtIndex", loadAmount] }, 0]
                                    },
                                    0,
                                    { $subtract: ["$startAtIndex", loadAmount] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            startAtIndex: 1,
                            actualLoadAmount: 1,
                            postReferences: {
                                $cond: [
                                    { $eq: ["$actualLoadAmount", 0] },
                                    [],
                                    {
                                        $slice: [
                                            "$postReferences",
                                            "$startAtIndex",
                                            "$actualLoadAmount"
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                ])
            )[0];
        }

        if (!result || !result.postReferences) {
            const errorResponse = "Posts not found for user: " + userId;
            response.statusCode = 404;
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            });

            return response;
        }

        result = result.postReferences.reverse();
    } else {
        const username = event.requestContext.authorizer.claims["cognito:username"];

        if (!startAt) {
            result = await User.findOne(
                {
                    username: username
                },
                {
                    postFeed: {
                        $slice: ["$postFeed", 0 - loadAmount]
                    }
                }
            );
        } else {
            result = (
                await User.aggregate([
                    {
                        $match: {
                            username: username
                        }
                    },
                    {
                        $project: {
                            postFeed: 1,
                            startAtIndex: {
                                $indexOfArray: ["$postFeed._id", ObjectId(startAt)]
                            }
                        }
                    },
                    {
                        $project: {
                            postFeed: 1,
                            actualLoadAmount: {
                                $cond: [
                                    { $lt: ["$startAtIndex", loadAmount] },
                                    "$startAtIndex",
                                    loadAmount
                                ]
                            },
                            startAtIndex: {
                                $cond: [
                                    {
                                        $lte: [{ $subtract: ["$startAtIndex", loadAmount] }, 0]
                                    },
                                    0,
                                    { $subtract: ["$startAtIndex", loadAmount] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            startAtIndex: 1,
                            actualLoadAmount: 1,
                            postFeed: {
                                $cond: [
                                    { $eq: ["$actualLoadAmount", 0] },
                                    [],
                                    { $slice: ["$postFeed", "$startAtIndex", "$actualLoadAmount"] }
                                ]
                            }
                        }
                    }
                ])
            )[0];
        }

        if (!result || !result.postFeed) {
            const errorResponse = "Feed not found for user: " + username;
            response.statusCode = 404;
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            });

            return response;
        }

        result = result.postFeed.reverse();
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: result });

    return response;
};

// POST request /post
const createPost = async function(event) {
    let postForm = JSON.parse(event.body).postForm;
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const postId = new ObjectId();

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Post = (await MongooseModels(MONGODB_URI)).Post;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    if (
        !postForm.content &&
        Object.keys(postForm.share).length === 0 &&
        postForm.filePaths.length === 0
    ) {
        const errorResponse = "No content provided!";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
    }

    // First get user.
    let fields = "username followers";
    const user = await User.findOne(
        {
            username: username
        },
        fields
    ).exec();

    if (!user) {
        const errorResponse = "Error finding user: " + username;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Now build out and send the post.
    const userReference = {
        userId: user._id,
        username: username
    };

    const post = new Post({
        _id: postId,
        content: postForm.content,
        createdBy: userReference,
        filePaths: postForm.filePaths,
        share: postForm.share
    });

    const postResult = await post.save().catch(err => {
        const errorResponse = "Error creating post: " + JSON.stringify(err);
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    });

    if (!postResult) {
        const errorResponse = "Error creating post. No response.";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
    }

    // Now build out and send the post reference to the createdBy user's postReferences and feed arary.
    const postReference = {
        _id: postId,
        createdBy: userReference
    };

    await User.update(
        { _id: user._id },
        {
            $push: { postFeed: postReference, postReferences: postReference }
        }
    ).catch(err => {
        // TODO: Delete previously created post.
        const errorResponse = "Error creating post in user document: " + JSON.stringify(err);
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
    });

    // Now push the post reference to the all the followers feed array.
    let feedPromises = [];
    user.followers.forEach(follow => {
        feedPromises.push(User.update({ _id: follow.userId }, { $push: { feed: postReference } }));
    });

    await Promise.all(feedPromises);

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: { postReference: postReference }
    });

    return response;
};

// DELETE request /post/{proxy+}
const deletePost = async function(event) {
    const postId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims["cognito:username"];

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Post = (await MongooseModels(MONGODB_URI)).Post;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    }

    // First pull post to see if it exists and user is authorized to delete it.
    const userResult = (
        await User.findOne(
            {
                username: username
            },
            {
                postReferences: {
                    $elemMatch: {
                        _id: postId,
                    }
                }
            }
        )
        .exec()
        .catch(err => {
            const errorResponse = (err.message || JSON.stringify(err));
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            });

            return response
        })
    ).postReferences[0];

    if (!userResult) {
        const errorResponse = "Not authorized";
        response.statusCode = 403;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        })

        return response;
    }

    // Now pull this post from every user's postFeed, likes, and comment
    const postResult = await Post.findById(postId, {
        feedReferences: 1,
        likes: 1,
        comments: 1,
        filePaths: 1
    }).exec();
    let userPullPromises = [];

    postResult.feedReferences.forEach(reference => {
        const userId = ObjectId(reference.userId);

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    postFeed: {
                        _id: postId
                    }
                }
            }
        );

        userPullPromises.push(query.exec());
    });

    postResult.likes.forEach(like => {
        const userId = ObjectId(like.createdBy.userId);

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    likes: {
                        _id: like._id,
                        docId: postId,
                        coll: "post"
                    }
                }
            }
        )

        userPullPromises.push(query.exec());
    });

    postResult.comments.forEach(comment => {
        comment.likes.forEach(commentLike => {
            const userId = ObjectId(commentLike.get("createdBy").userId);

            const query = User.updateOne(
                { _id: userId },
                {
                    $pull: {
                        _id: commentLike._id,
                        docId: postId,
                        coll: "post/comment"
                    }
                }
            )

            userPullPromises.push(query.exec());
        })

        const userId = ObjectId(comment.createdBy.userId);

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    comments: {
                        _id: comment._id,
                        docId: postId,
                        coll: "post"
                    }
                }
            }
        )

        userPullPromises.push(query.exec());
    });

    // Next, pull from logged in user's postReferences
    const query = User.updateOne(
        { username: username },
        {
            $pull: {
                postReferences: {
                    _id: postId
                }
            }
        }
    )

    userPullPromises.push(query.exec())

    // Delete filePaths. TODO: Delete videos.
    const s3 = new aws.S3();
    let s3DeletePromises = [];

    postResult.filePaths.forEach(path => {
        if (path.type === "image") {
            s3DeletePromises.push(s3.deleteObject({
                Bucket: process.env.STORAGE_PROJECTBURNSTORAGE_BUCKETNAME,
                Key: path.key
            }).promise())
        }
    })

    await Promise.all(s3DeletePromises);
    await Promise.all(userPullPromises);

    // Finally, delete the post.
    const result = await Post.deleteOne({ _id: postId }).exec();

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: result });

    return response;
}

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

    console.log("EVENT:", JSON.stringify(event));

    switch (event.httpMethod) {
        case "GET":
            if (event.resource === "/post") {
                response = await queryPost(event);
            } else {
                response = await getPost(event);
            }
            break;
        case "POST":
            response = await createPost(event);
            break;
        // case "PUT":
        //     response = await editPost(event);
        //     break;
        case "DELETE":
            response = await deletePost(event);
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
