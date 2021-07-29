const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /follow
const queryFollow = async function(event) {
    const docId = ObjectId(event.queryStringParameters.docId);
    const coll = event.queryStringParameters.coll;
    const loadAmount = Number(event.queryStringParameters.loadAmount);
    const username = event.requestContext.authorizer.claims["cognito:username"];

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
        case "user":
            Model = (await MongooseModels(MONGODB_URI)).User;
            break;
        default:
            response.statusCode = 400;
            response.body = "Incorrect collection provided.";
            return response;
    }

    let result;

    if (coll !== "user") {
        const collResult = await Model.findOne(
            {
                _id: docId
            },
            {
                followCount: 1,
                createdBy: 1,
                follows: {
                    $elemMatch: {
                        username: username
                    }
                },
                recentFollows: {
                    $slice: [ "$follows", 0 - loadAmount ]
                }
            }
        );

        if (!collResult) {
            const errorResponse = "No document found: " + docId;
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });

            return response;
        }

        result = {
            followCount: collResult.followCount,
            follows: collResult.recentFollows,
            isFollowed: (collResult.follows && collResult.follows.length > 0) ? true : false,
            isFollowable: (collResult.createdBy.username !== username) ? true : false
        }
    } else {
        const collResult = await Model.findOne(
            {
                _id: docId
            },
            {
                followerCount: 1,
                followingCount: 1,
                followers: {
                    $elemMatch: {
                        username: username
                    }
                }
            }
        );

        if (!collResult) {
            const errorResponse = "User not found: " + docId;
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });

            return response;
        }

        result = {
            followerCount: collResult.followerCount,
            followingCount: collResult.followingCount,
            isFollowed: (collResult.followers && collResult.followers.length > 0) ? true : false
        }
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: result });

    return response;
}

// POST request /follow
const createFollow = async function(event) {
    const docId = new ObjectId(event.queryStringParameters.docId);
    const coll = event.queryStringParameters.coll;
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const _id = new ObjectId();

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let User = (await MongooseModels(MONGODB_URI)).User;

    // First get user's _id.
    let fields = "username";
    const user = await User.findOne({ username: username }, fields).exec();

    // Push the follow to the relevant document's array.
    const userReference = {
        userId: ObjectId(user._id),
        username: username,
        _id: _id
    }

    if (coll === "exercise") {
        const Exercise = (await MongooseModels(MONGODB_URI)).Exercise;

        // First check is user has followed already, while at the same time pulling relevant values
        // for the exerciseReference.
        const collResult = await Exercise.findOne(
            {
                _id: docId
            },
            {
                name: 1,
                muscleGroups: 1,
                tags: 1,
                follows: {
                    $elemMatch: {
                        "username": username
                    }
                }
            }
        );

        if (collResult) {
            const errorResponse = "No exercise found: " + docId
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse })
            return response;
        } else if (collResult.follows.length > 0) {
            const errorResponse = "Already followed!";
            response.statusCode = 403;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // First push to user references.
        const exerciseReference = {
            exerciseId: collResult._id,
            name: collResult.name,
            muscleGroups: collResult.muscleGroups,
            tags: collResult.tags,
            isFollow: true,
            _id: _id
        }

        const userResult = await User.updateOne(
            {
                username: username
            },
            {
                $push: {
                    exerciseReferences: exerciseReference
                }
            }
        );

        if (!userResult) {
            const errorResponse = "No exercise reference created.";
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // Next push user to follows.
        const exercisePushResult = await Exercise.updateOne(
            {
                _id: docId
            },
            {
                $push: {
                    follows: userReference
                },
                $inc: {
                    followCount: 1
                }
            }
        )

        if (!exercisePushResult) {
            // TODO: Delete from users exercise references.
            const errorResponse = "No follow created in exercise.";
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }
    } else if (coll === "template") {
        const Template = (await MongooseModels(MONGODB_URI)).Template;

        // First check is user has followed already, while at the same time pulling relevant values
        // for the templateReference.
        const collResult = await Template.findOne(
            {
                _id: docId
            },
            {
                name: 1,
                muscleGroups: 1,
                tags: 1,
                follows: {
                    $elemMatch: {
                        "username": username
                    }
                }
            }
        );

        if (collResult) {
            const errorResponse = "No template found: " + docId
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse })
            return response;
        } else if (collResult.follows.length > 0) {
            const errorResponse = "Already followed!";
            response.statusCode = 403;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // First push to user references.
        const templateReference = {
            templateId: collResult._id,
            name: collResult.name,
            muscleGroups: collResult.muscleGroups,
            tags: collResult.tags,
            isFollow: true,
            _id: _id
        }

        const userResult = await User.updateOne(
            {
                username: username
            },
            {
                $push: {
                    templateReferences: templateReference
                }
            }
        );

        if (!userResult) {
            const errorResponse = "No exercise reference created.";
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // Next push user to follows.
        const templatePushResult = await Template.updateOne(
            {
                _id: docId
            },
            {
                $push: {
                    follows: userReference
                },
                $inc: {
                    followCount: 1
                }
            }
        )

        if (!templatePushResult) {
            // TODO: Delete from users template references.
            const errorResponse = "No follow created in template.";
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }
    } else if (coll === "user") {
        // First check if user is already following the other user.
        const followedUser = await User.findOne(

            {
                _id: docId
            },
            {
                username: 1,
                followers: {
                    $elemMatch: {
                        "username": username
                    }
                }
            }
        );

        if (followedUser) {
            const errorResponse = "No user found: " + docId
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse })
            return response;
        } else if (followedUser.follows.length > 0) {
            const errorResponse = "Already followed!";
            response.statusCode = 403;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // First push to user following.
        const followedUserReference = {
            userId: docId,
            username: followedUser.username,
            _id: _id
        }

        const followingPushResult = await User.updateOne(
            {
                username: username
            },
            {
                $push: {
                    following: followedUserReference
                },
                $inc: {
                    followingCount: 1
                }
            }
        )

        if (!followingPushResult) {
            const errorResponse = "Not pushed to users following.";
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // Next push to followed user's followers.
        const followerPushResult = await User.updateOne(
            {
                _id: docId
            },
            {
                $push: {
                    followers: userReference
                },
                $inc: {
                    followerCount: 1
                }
            }
        );

        if (!followerPushResult) {
            // TODO: Remove from following above.
            const errorResponse = "Not pushed to target user's followers.";
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }
    } else {
        const errorResponse = "Collection does not exist.";
        response.statusCode = 400;
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
        return response;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true })

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

    switch (event.httpMethod) {
        case "GET":
            response = await queryFollow(event);
            break;
        case "POST":
            response = await createFollow(event);
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
