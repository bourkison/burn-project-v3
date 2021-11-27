const aws = require("aws-sdk");
const MongooseModels = require("/opt/nodejs/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /follow/{proxy+}
const getFollow = async function(event) {
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
        case "user":
            Model = await MongooseModels().User(MONGODB_URI);
            break;
        default:
            response.statusCode = 400;
            response.body = "Incorrect collection provided.";
            return response;
    }

    let findProjection = {};

    if (coll !== "user") {
        findProjection.followCount = 1;
        findProjection.follows = {
            $slice: [ "$follows", 0 - loadAmount ]
        }
    } else {
        findProjection.followerCount = 1;
        findProjection.followers = {
            $slice: [ "$followers", 0 - loadAmount ]
        }
    }

    const collResult = await Model.findOne({ _id: docId }, findProjection);

    if (!collResult) {
        const errorResponse = "No document found: " + docId;
        response.statusCode = 404;
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });

        return response;
    }

    let responseData = {};

    if (coll !== "user") {
        responseData.follows = collResult.follows;
        responseData.followCount = collResult.followCount;
    } else {
        responseData.followers = collResult.followers;
        responseData.followerCount = collResult.followerCount;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: responseData });

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

    let User = await MongooseModels().User(MONGODB_URI);

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
        const Exercise = await MongooseModels().Exercise(MONGODB_URI);

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
                createdBy: 1,
                follows: {
                    $elemMatch: {
                        "username": username
                    }
                }
            }
        );

        if (!collResult) {
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
        const createdByReference = {
            username: collResult.createdBy.username,
            userId: collResult.createdBy.userId
        }

        const exerciseReference = {
            exerciseId: collResult._id,
            name: collResult.name,
            muscleGroups: collResult.muscleGroups,
            tags: collResult.tags,
            isFollow: true,
            _id: _id,
            createdBy: createdByReference
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
        const Template = await MongooseModels().Template(MONGODB_URI);

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
                createdBy: 1,
                follows: {
                    $elemMatch: {
                        "username": username
                    }
                }
            }
        );

        if (!collResult) {
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
        const createdByReference = {
            username: collResult.createdBy.username,
            userId: collResult.createdBy.userId
        }

        const templateReference = {
            templateId: collResult._id,
            name: collResult.name,
            muscleGroups: collResult.muscleGroups,
            tags: collResult.tags,
            isFollow: true,
            _id: _id,
            createdBy: createdByReference
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
                },
                postReferences: 1
            }
        );

        if (!followedUser) {
            const errorResponse = "No user found: " + docId
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse })
            return response;
        } else if (followedUser.followers.length > 0) {
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
                    following: followedUserReference,
                    postFeed: {
                        $each: followedUser.postReferences,
                        $sort: {
                            createdAt: -1
                        }
                    }
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


// DELETE request /follow
const deleteFollow = async function(event) {
    const docId = ObjectId(event.queryStringParameters.docId);
    const coll = event.queryStringParameters.coll;
    const username = event.requestContext.authorizer.claims["cognito:username"];

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    const User = await MongooseModels().User(MONGODB_URI);

    if (coll === "exercise" || coll === "template") {
        let Model;

        if (coll === "exercise") {
            Model = await MongooseModels().Exercise(MONGODB_URI);
        } else {
            Model = await MongooseModels().Template(MONGODB_URI);
        }

        // First check if user has followed already.
        const collResult = await Model.findOne(
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

        if (!collResult) {
            const errorResponse = "No exercise found: " + docId
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse })
            return response;
        } else if (collResult.follows.length === 0) {
            const errorResponse = "Not followed!";
            response.statusCode = 403;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        let userResult;

        if (coll === "exercise") {
            // First pull reference from user's follows.
            userResult = await User.updateOne(
                {
                    username: username
                },
                {
                    $pull: {
                        exerciseReferences: {
                            exerciseId: docId
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
                        templateReferences: {
                            templateId: docId
                        }
                    }
                }
            );
        }

        if (!userResult) {
            const errorResponse = "Error pulling reference from user. No response: " + docId;
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            })

            return response;
        }

        // Next pull for exercise's follows.
        const modelPullResult = await Model.updateOne(
            {
                _id: docId
            },
            {
                $pull: {
                    follows: {
                        "username": username
                    }
                },
                $inc: {
                    followCount: -1
                }
            }
        );

        if (!modelPullResult) {
            const errorResponse = "Couldn't pull follow from exercise. No response.";
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            })
        }
    } else if (coll === "user") {
        // First check if user is actually following the other user.
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

        if (!followedUser) {
            const errorResponse = "No user found: " + docId
            response.statusCode = 404;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse })
            return response;
        } else if (!followedUser.followers || followedUser.followers.length === 0) {
            const errorResponse = "Not followed!";
            response.statusCode = 403;
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // First remove from user following.
        const followingPullResult = await User.updateOne(
            {
                username: username
            },
            {
                $pull: {
                    following: {
                        userId: docId
                    },
                    postFeed: {
                        "createdBy.username": followedUser.username
                    }
                },
                $inc: {
                    followingCount: -1
                }
            }
        );

        if (!followingPullResult) {
            const errorResponse = "Not pulled from users following.";
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // Now pull from followed user's followers.
        const followerPullResult = await User.updateOne(
            {
                _id: docId
            },
            {
                $pull: {
                    followers: {
                        username: username
                    }
                },
                $inc: {
                    followerCount: -1
                }
            }
        );

        if (!followerPullResult) {
            // TODO: Remove from following above.
            const errorResponse = "Not pushed to target user's followers.";
            response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
            return response;
        }

        // TODO: Remove followed users posts from the user's postFeed.
    } else {
        const errorResponse = "Collection does not exist.";
        response.statusCode = 400;
        response.body = JSON.stringify({ success: false, errorMessage: errorResponse });
        return response;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true });

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
            response = await getFollow(event);
            break;
        case "POST":
            response = await createFollow(event);
            break;
        case "DELETE":
            response = await deleteFollow(event);
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
