const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /exercise/{proxy+}
const getExercise = async function(event) {
    const exerciseId = ObjectId(event.pathParameters.proxy);
    const Exercise = (await MongooseModels(MONGODB_URI)).Exercise;
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const counters = (event.queryStringParameters && event.queryStringParameters.counters === "true") || false;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let findProjection = {
        createdBy: 1,
        description: 1,
        difficulty: 1,
        filePaths: 1,
        measureBy: 1,
        muscleGroups: 1,
        name: 1,
        tags: 1
    };

    if (counters) {
        findProjection.likeCount = 1;
        findProjection.commentCount = 1;
        findProjection.followCount = 1;
        findProjection.likes = { 
            $elemMatch: {
                "createdBy.username": username
            }  
        };
        findProjection.follows = {
            $elemMatch: {
                "username": username
            }
        };
    }

    const result = await Exercise.findOne({ _id: exerciseId }, findProjection).exec();


    if (!result) {
        const errorResponse =
            "Exercise: " + exerciseId + " not found." + JSON.stringify(event);
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    let responseData = {
        _id: result._id,
        createdBy: result.createdBy,
        description: result.description,
        difficulty: result.difficulty,
        filePaths: result.filePaths,
        measureBy: result.measureBy,
        muscleGroups: result.muscleGroups,
        name: result.name,
        tags: result.tags,
    }

    if (counters) {
        const isLiked = (result.likes && result.likes.length) ? true : false;
        const isFollowed = (result.follows && result.follows.length) ? true : false;
        const isFollowable = (result.createdBy && result.createdBy.username !== username) ? true : false

        responseData.likeCount = result.likeCount;
        responseData.commentCount = result.commentCount;
        responseData.followCount = result.followCount;
        responseData.isLiked = isLiked;
        responseData.isFollowed = isFollowed;
        responseData.isFollowable = isFollowable;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: responseData });

    return response;
};

// GET request /exercise
const queryExercise = async function(event) {
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const loadAmount = event.queryStringParameters.loadAmount
        ? Number(event.queryStringParameters.loadAmount)
        : 5;
    const userBool = event.queryStringParameters.user === "true";
    const muscleGroups = event.queryStringParameters.muscleGroups
        ? event.queryStringParameters.muscleGroups.split(",")
        : null;
    const tags = event.queryStringParameters.tags
        ? event.queryStringParameters.tags.split(",")
        : null;
    const startAt = event.queryStringParameters.startAt;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let result;

    if (userBool) {
        const User = (await MongooseModels(MONGODB_URI)).User;
        let exerciseQuery = [
            {
                $match: {
                    username: username
                }
            },
            {
                $project: {
                    exerciseReferences: 1,
                    username: 1
                }
            }
        ];

        if (muscleGroups) {
            exerciseQuery.push({
                $addFields: {
                    inputMuscleGroups: muscleGroups
                }
            });

            exerciseQuery.push({
                $project: {
                    username: 1,
                    exerciseReferences: {
                        $reduce: {
                            input: "$exerciseReferences",
                            initialValue: [],
                            in: {
                                $cond: [
                                    {
                                        $setIsSubset: [
                                            "$inputMuscleGroups",
                                            "$$this.muscleGroups"
                                        ]
                                    },
                                    {
                                        $concatArrays: ["$$value", ["$$this"]]
                                    },
                                    "$$value"
                                ]
                            }
                        }
                    }
                }
            });
        }

        if (tags) {
            exerciseQuery.push({
                $addFields: {
                    inputTags: tags
                }
            });

            exerciseQuery.push({
                $project: {
                    username: 1,
                    exerciseReferences: {
                        $reduce: {
                            input: "$exerciseReferences",
                            initialValue: [],
                            in: {
                                $cond: [
                                    {
                                        $setIsSubset: [
                                            "$inputTags",
                                            "$$this.tags"
                                        ]
                                    },
                                    {
                                        $concatArrays: ["$$value", ["$$this"]]
                                    },
                                    "$$value"
                                ]
                            }
                        }
                    }
                }
            });
        }

        if (!startAt) {
            exerciseQuery.push({
                $project: {
                    exerciseReferences: {
                        $slice: ["$exerciseReferences", 0 - loadAmount]
                    }
                }
            });
        } else {
            exerciseQuery.push({
                $project: {
                    exerciseReferences: 1,
                    startAtIndex: {
                        $indexOfArray: [ "$exerciseReferences.exerciseId", ObjectId(startAt) ]
                    }
                }
            })

            exerciseQuery.push({
                $project: {
                    exerciseReferences: 1,
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
            })

            exerciseQuery.push({
                $project: {
                    startAtIndex: 1,
                    actualLoadAmount: 1,
                    exerciseReferences: {
                        $cond: [
                            { $eq: ["$actualLoadAmount", 0] },
                            [],
                            { $slice: ["$exerciseReferences", "$startAtIndex", "$actualLoadAmount"] }
                        ]
                    }
                }
            })
        }


        result = await User.aggregate(exerciseQuery);

        if (result[0] && result[0].exerciseReferences) {
            result = result[0].exerciseReferences.reverse();
        } else {
            result = [];
        }
    } else {
        const Exercise = (await MongooseModels(MONGODB_URI)).Exercise;

        let exerciseQuery = {};

        if (muscleGroups) {
            exerciseQuery.muscleGroups = {
                $all: muscleGroups
            };
        }

        if (tags) {
            exerciseQuery.tags = {
                $all: tags
            };
        }

        if (startAt) {
            // As we order by createdAt, we need to find the createdAt field of startAt element,
            // then filter for when greater than that value.
            const startAtCreatedAt = (await Exercise.findOne({ _id: ObjectId(startAt) }, { createdAt: 1 })).createdAt;
            
            // Then add query for where exercise is greater than createdAt OR its equal and ID is bigger.
            exerciseQuery.$or = [
                { 
                    createdAt: { $lt: startAtCreatedAt }
                },
                {
                    createdAt: startAtCreatedAt,
                    _id: { $lt: ObjectId(startAt) }
                }
            ];
        }

        let fields = "createdBy createdAt name tags muscleGroups updatedAt";
        result = await Exercise.find(exerciseQuery, fields)
            .sort({ createdAt: -1, _id: -1 })
            .limit(loadAmount);
    }

    if (!result || !result.length) {
        const errorResponse = "No exercises found!";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: result });

    return response;
};

// POST request.
const createExercise = async function(event) {
    let exerciseForm = JSON.parse(event.body).exerciseForm;
    const username = event.requestContext.authorizer.claims["cognito:username"];

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Exercise = (await MongooseModels(MONGODB_URI)).Exercise;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    // First get user ID.
    let fields = "username";
    const user = await User.findOne(
        {
            username: username
        },
        fields
    ).exec();

    if (!user) {
        const errorResponse = "Error finding user: " + username
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Now build out and send the new Exercise.
    const userReference = {
        userId: user._id,
        username: user.username
    };

    const exercise = new Exercise({
        createdBy: userReference,
        description: exerciseForm.description,
        difficulty: exerciseForm.difficulty,
        filePaths: exerciseForm.filePaths,
        measureBy: exerciseForm.measureBy,
        muscleGroups: exerciseForm.muscleGroups,
        name: exerciseForm.name,
        tags: exerciseForm.tags,
        follows: [userReference],
        followCount: 1
    });

    const exerciseResult = await exercise.save().catch(err => {
        const errorResponse = "Error creating exercise: " + JSON.stringify(err);
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    });

    console.log("EXERCISE RESULT:", exerciseResult);

    if (!exerciseResult) {
        const errorResponse = "Error creating exercise. No response.";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }
    // Now build out the exercise reference, and add that to the User's exerciseReferences array.
    const exerciseReference = {
        exerciseId: ObjectId(exerciseResult._id),
        muscleGroups: exerciseResult.muscleGroups,
        tags: exerciseResult.tags,
        isFollow: false,
        name: exerciseResult.name,
        createdBy: userReference
    };

    await User.update(
        { _id: user._id },
        { $push: { exerciseReferences: exerciseReference } }
    ).catch(err => {
        // TODO: Delete previously created exercise.
        const errorResponse =
            "Error creating exercise in user document: " + JSON.stringify(err);
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    });

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        _id: exerciseResult._id,
        data: exerciseResult
    });

    return response;
};

// PUT request.
const updateExercise = async function(event) {
    const exerciseId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims["cognito:username"];
    let exerciseForm = JSON.parse(event.body).exerciseForm;

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Exercise = (await MongooseModels(MONGODB_URI)).Exercise;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    // First pull exercise data from user to ensure user has access to edit.
    console.log("Finding username:", username, "Exercise ID:", exerciseId);
    const userResult = (
        await User.findOne(
            {
                username: username
            },
            {
                exerciseReferences: {
                    $elemMatch: {
                        exerciseId: exerciseId,
                        isFollow: false
                    }
                }
            }
        )
            .exec()
            .catch(err => {
                const errorResponse =
                    "Error getting exercise from user: " +
                    username +
                    " : " +
                    exerciseId +
                    ". " +
                    (err.message || JSON.stringify(err));
                response.body = JSON.stringify({
                    success: false,
                    errorMessage: errorResponse
                });

                return response;
            })
    ).exerciseReferences[0];

    console.log("Found:", userResult);

    if (!userResult) {
        const errorResponse = "Not authorized";
        response.statusCode = 403;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Now update the Exercise document.
    const exerciseResult = await Exercise.findByIdAndUpdate(
        exerciseId,
        exerciseForm,
        { runValidators: true }
    )
        .exec()
        .catch(err => {
            const errorResponse =
                "Error updating exercise : " +
                exerciseId +
                " : " +
                JSON.stringify(exerciseForm) +
                ". " +
                (err.message || JSON.stringify(err));
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            });

            return response;
        });

    // Now update the exercise reference in the User.
    console.log("Updating exercise reference");

    const userUpdateResult = await User.updateOne(
        {
            username: username,
            "exerciseReferences.exerciseId": exerciseId
        },
        {
            $set: {
                "exerciseReferences.$.muscleGroups": exerciseForm.muscleGroups,
                "exerciseReferences.$.tags": exerciseForm.tags,
                "exerciseReferences.$.name": exerciseForm.name
            }
        }
    );

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: exerciseResult,
        userData: userUpdateResult
    });

    return response;
};

// DELETE request.
const deleteExercise = async function(event) {
    const exerciseId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims["cognito:username"];

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Exercise = (await MongooseModels(MONGODB_URI)).Exercise;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    // First pull exercise from user to see if it exists (thus the user has auth to delete).
    const userResult = (
        await User.findOne(
            {
                username: username
            },
            {
                exerciseReferences: {
                    $elemMatch: {
                        exerciseId: exerciseId,
                        isFollow: false
                    }
                }
            }
        )
            .exec()
            .catch(err => {
                const errorResponse =
                    "Error getting exercise from user: " +
                    username +
                    " : " +
                    exerciseId +
                    ". " +
                    (err.message || JSON.stringify(err));
                response.body = JSON.stringify({
                    success: false,
                    errorMessage: errorResponse
                });

                return response;
            })
    ).exerciseReferences[0];

    if (!userResult) {
        const errorResponse = "Exercise not found for user: " + username + ".";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Now pull all likes, comments and follows from the exercise and pull their reference from each user (this includes the user who created).
    const exerciseResult = await Exercise.findById(exerciseId, {
        follows: 1,
        likes: 1,
        comments: 1
    }).exec();
    let userPullPromises = [];

    const likes = exerciseResult.likes;
    const comments = exerciseResult.comments;
    const follows = exerciseResult.follows;

    likes.forEach(like => {
        console.log("LIKE TO DELETE:", like);
        const userId = ObjectId(like.createdBy.userId);

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    likes: {
                        _id: like._id,
                        docId: exerciseId,
                        coll: "exercise"
                    }
                }
            }
        );

        userPullPromises.push(query.exec());
    });

    comments.forEach(comment => {
        console.log("COMMENT TO DELETE:", comment);
        comment.likes.forEach(commentLike => {
            console.log("COMMENT LIKE TO DELETE:", commentLike);
            const userId = ObjectId(commentLike.get("createdBy").userId);

            const query = User.updateOne(
                { _id: userId },
                {
                    $pull: {
                        likes: {
                            _id: commentLike._id,
                            docId: exerciseId,
                            coll: "exercise/comment"
                        }
                    }
                }
            );

            userPullPromises.push(query.exec());
        });

        const userId = ObjectId(comment.createdBy.userId);

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    comments: {
                        _id: comment._id,
                        docId: exerciseId,
                        coll: "exercise"
                    }
                }
            }
        );

        userPullPromises.push(query.exec());
    });

    follows.forEach(follow => {
        const userId = ObjectId(follow.get("userId"));

        console.log("USER ID:", userId);
        console.log("EXERCISE ID:", exerciseId);

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    exerciseReferences: {
                        exerciseId: exerciseId
                    }
                }
            }
        );

        userPullPromises.push(query.exec());
    });

    await Promise.all(userPullPromises);

    // TODO: Delete all images/videos associated with this exercise.

    // TODO: Delete all exerciseReferences in workouts associated with this exercise.

    // Finally delete the exercise.
    const result = await Exercise.deleteOne({ _id: exerciseId }).exec();

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: result });

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
            if (event.resource === "/exercise") {
                response = await queryExercise(event);
            } else {
                response = await getExercise(event);
            }
            break;
        case "POST":
            response = await createExercise(event);
            break;
        case "PUT":
            response = await updateExercise(event);
            break;
        case "DELETE":
            response = await deleteExercise(event);
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

    console.log("RESPONSE:", response);
    console.log("EVENT:", event);
    console.log(
        "USER:",
        event.requestContext.authorizer.claims["cognito:username"]
    );
    console.log("REQUEST CONTEXT:", event.requestContext);
    return response;
};
