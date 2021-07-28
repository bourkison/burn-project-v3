const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /post
const queryPost = async function(event) {
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const loadAmount = event.queryStringParameters.loadAmount
        ? Number(event.queryStringParameters.loadAmount)
        : 5;
    const userId = (event.queryStringParameters.userId) ? event.queryStringParameters.userId : null

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
        result = await (User.findOne(
            {
                _id: userId
            },
            {
                postReferences: {
                    $slice: ["$postReferences", 0 - loadAmount]
                }
            }
        ));

        if (!result.postReferences) {
            const errorResponse = "Posts not found for user: " + userId;
            response.statusCode = 404;
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            })

            return response;
        } else {
            result = result.postReferences
        }
    } else {
        result = await (User.findOne(
            {
                username: username
            },
            {
                postFeed: {
                    $slice: ["$feed", 0 - loadAmount]
                }
            }
        ))

        if (result.postReferences) {
            const errorResponse = "Feed not found for user: " + userId;
            response.statusCode = 404;
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            })

            return response;
        } else {
            result = result.postReferences
        }
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
        const errorResponse =
            "Error creating post in user document: " + JSON.stringify(err);
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
    });

    // Now push the post reference to the all the followers feed array.
    let feedPromises = [];
    user.followers.forEach(follow => {
        feedPromises.push(
            User.update(
                { _id: follow.userId },
                { $push: { feed: postReference } }
            )
        );
    });

    await Promise.all(feedPromises);

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: { postReference: postReference }
    })

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
            response = await queryPost(event);
            break;
        case "POST":
            response = await createPost(event);
            break;
        // case "PUT":
        //     response = await editPost(event);
        //     break;
        // case "DELETE":
        //     response = await deletePost(event);
        //     break;
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
