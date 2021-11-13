const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /template/{proxy+}
const getTemplate = async function(event) {
    const templateId = ObjectId(event.pathParameters.proxy);
    const Template = (await MongooseModels(MONGODB_URI)).Template;
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
        exerciseReferences: 1,
        muscleGroups: 1,
        name: 1,
        tags: 1
    }

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

    const result = await Template.findOne({ _id: templateId }, findProjection).exec();

    if (!result) {
        const errorResponse =
            "Template: " + templateId + " not found." + JSON.stringify(event);
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    const responseData = {
        _id: result._id,
        createdBy: result.createdBy,
        description: result.description,
        difficulty: result.difficulty,
        exerciseReferences: result.exerciseReferences,
        muscleGroups: result.muscleGroups,
        name: result.name,
        tags: result.tags
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

// GET request /template
const queryTemplate = async function(event) {
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const loadAmount = (event.queryStringParameters.loadAmount) ? Number(event.queryStringParameters.loadAmount) : 5;
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
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let result;

    if (userBool) {
        const User = (await MongooseModels(MONGODB_URI)).User;

        let templateQuery = [
            {
                $match: {
                    username: username
                }
            },
            {
                $project: {
                    templateReferences: 1,
                    username: 1
                }
            }
        ];

        if (muscleGroups) {
            templateQuery.push({
                $addFields: {
                    inputMuscleGroups: muscleGroups
                }
            });

            templateQuery.push({
                $project: {
                    username: 1,
                    templateReferences: {
                        $reduce: {
                            input: "$templateReferences",
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
            templateQuery.push({
                $addFields: {
                    inputTags: tags
                }
            });

            templateQuery.push({
                $project: {
                    username: 1,
                    templateReferences: {
                        $reduce: {
                            input: "$templateReferences",
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
            templateQuery.push({
                $project: {
                    templateReferences: {
                        $slice: ["$templateReferences", 0 - loadAmount]
                    }
                }
            });
        } else {
            templateQuery.push({
                $project: {
                    templateReferences: 1,
                    startAtIndex: {
                        $indexOfArray: [ "$templateReferences.templateId", ObjectId(startAt) ]
                    }
                }
            })

            templateQuery.push({
                $project: {
                    templateReferences: 1,
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

            templateQuery.push({
                $project: {
                    startAtIndex: 1,
                    actualLoadAmount: 1,
                    templateReferences: {
                        $cond: [
                            { $eq: ["$actualLoadAmount", 0] },
                            [],
                            { $slice: ["$templateReferences", "$startAtIndex", "$actualLoadAmount"] }
                        ]
                    }
                }
            })
        }


        result = await User.aggregate(templateQuery);

        if (result[0] && result[0].templateReferences) {
            result = result[0].templateReferences.reverse();
        } else {
            result = [];
        }
    } else {
        const Template = (await MongooseModels(MONGODB_URI)).Template;

        let templateQuery = {};

        if (muscleGroups) {
            templateQuery.muscleGroups = {
                $all: muscleGroups
            };
        }

        if (tags) {
            templateQuery.tags = {
                $all: tags
            };
        }

        if (startAt) {
            // As we order by createdAt, we need to find the createdAt field of startAt element,
            // then filter for when greater than that value.
            const startAtCreatedAt = (await Template.findOne({ _id: ObjectId(startAt) }, { createdAt: 1 })).createdAt;

            // Then add query for where exercise is greater than createdAt OR its equal and ID is bigger.
            templateQuery.$or = [
                {
                    createdAt: { $gt: startAtCreatedAt }
                },
                {
                    createdAt: startAtCreatedAt,
                    _id: { $gt: ObjectId(startAt) }
                }
            ]
        }

        let fields = "createdBy createdAt name tags muscleGroups updatedAt";
        result = await Template.find(templateQuery, fields)
            .sort({ createdAt: 1, _id: 1 })
            .limit(loadAmount);
    }

    if (!result || !result.length) {
        const errorResponse = "Templates not found for user: " + username + ".";
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

// POST request
const createTemplate = async function(event) {
    let templateForm = JSON.parse(event.body).templateForm;

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Template = (await MongooseModels(MONGODB_URI)).Template;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    // First get User ID.
    let fields = "username";
    const user = await User.findOne(
        {
            username: event.requestContext.authorizer.claims["cognito:username"]
        },
        fields
    ).exec();

    if (!user) {
        const errorResponse =
            "Error finding user: " +
            event.requestContext.authorizer.claims["cognito:username"] +
            ".\n" +
            JSON.stringify(event.requestContext.authorizer);
        response.statusCode = 404;
        response.body = JSON.stringify({ success: true, data: errorResponse });

        return response;
    }

    // Now build out and send the new Template.
    const userReference = {
        userId: ObjectId(user._id),
        username: user.username
    };

    const template = new Template({
        createdBy: userReference,
        description: templateForm.description,
        difficulty: templateForm.difficulty,
        exerciseReferences: templateForm.exercises,
        muscleGroups: templateForm.muscleGroups,
        name: templateForm.name,
        tags: templateForm.tags,
        follows: [userReference],
        followCount: 1
    });

    const templateResult = await template.save().catch(err => {
        const errorResponse = "Error creating template: " + JSON.stringify(err);
        response.body = JSON.stringify({
            success: true,
            errorMessage: errorResponse
        });

        return response;
    });

    if (!templateResult) {
        const errorResponse = "Error creating template. No response";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Now build out template reference
    const templateReference = {
        templateId: ObjectId(templateResult._id),
        name: templateResult.name,
        muscleGroups: templateResult.muscleGroups,
        tags: templateResult.tags,
        isFollow: false,
        createdBy: userReference
    };

    await User.updateOne(
        { _id: user._id },
        { $push: { templateReferences: templateReference } }
    ).catch(err => {
        // TODO: Delete previously created template
        const errorResponse =
            "Error creating template in user document: " + JSON.stringify(err);
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    });

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        _id: templateResult._id,
        data: templateResult
    });

    return response;
};

// PUT request
const updateTemplate = async function(event) {
    const templateId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims["cognito:username"];
    let templateForm = JSON.parse(event.body).templateForm;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Template = (await MongooseModels(MONGODB_URI)).Template;

    // First pull template data to ensure user created this and has access to edit.
    const userResult = (
        await User.findOne(
            {
                username: username
            },
            {
                templateReferences: {
                    $elemMatch: {
                        templateId: templateId,
                        isFollow: false
                    }
                }
            }
        )
            .exec()
            .catch(err => {
                const errorResponse =
                    "Error getting template from user: " +
                    username +
                    " : " +
                    templateId +
                    ". " +
                    (err.message || JSON.stringify(err));
                response.body = JSON.stringify({
                    success: false,
                    errorMessage: errorResponse
                });

                return response;
            })
    ).templateReferences[0];

    if (!userResult) {
        const errorResponse =
            "Template " + templateId + " not found for user " + username + ".";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    // Now update Template document.
    const result = await Template.findByIdAndUpdate(templateId, templateForm, {
        runValidators: true
    })
        .exec()
        .catch(err => {
            const errorResponse =
                "Error updating template : " +
                templateId +
                " : " +
                JSON.stringify(templateForm) +
                ". " +
                (err.message || JSON.stringify(err));
            response.body = JSON.stringify({
                success: false,
                errorMessage: errorResponse
            });

            return response;
        });

    // Now update the template reference in the User.
    await User.updateOne(
        {
            username: username,
            "templateReferences.templateId": templateId
        },
        {
            $set: {
                "templateReferences.$.muscleGroups": templateForm.muscleGroups,
                "templateReferences.$.tags": templateForm.tags,
                "templateReferences.$.name": templateForm.name
            }
        }
    );

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: result });

    return response;
};

// DELETE request
const deleteTemplate = async function(event) {
    const templateId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims["cognito:username"];

    const User = (await MongooseModels(MONGODB_URI)).User;
    const Template = (await MongooseModels(MONGODB_URI)).Template;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    // First pull template data from user to see if it exists (thus the user has auth to delete).
    const userResult = (
        await User.findOne(
            {
                username: username
            },
            {
                templateReferences: {
                    $elemMatch: {
                        templateId: templateId,
                        isFollow: false
                    }
                }
            }
        )
            .exec()
            .catch(err => {
                const errorResponse =
                    "Error getting template from user: " +
                    username +
                    " : " +
                    templateId +
                    ". " +
                    (err.message || JSON.stringify(err));
                response.body = JSON.stringify({
                    success: false,
                    errorMessage: errorResponse
                });

                return response;
            })
    ).templateReferences[0];

    if (!userResult) {
        const errorResponse = "Template not found for user: " + username + ".";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
    }

    // Now pull all follows for the template and pull their reference from each user.
    const templateResult = await Template.findById(templateId, {
        follows: 1,
        likes: 1,
        comments: 1
    }).exec();
    let userPullPromises = [];

    const likes = templateResult.likes;
    const comments = templateResult.comments;
    const follows = templateResult.follows;

    likes.forEach(like => {
        console.log("LIKE TO DELETE:", like);
        const userId = ObjectId(like.createdBy.userId);

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    likes: {
                        _id: like._id,
                        docId: templateId,
                        coll: "template"
                    }
                }
            }
        );

        userPullPromises.push(query.exec());
    });

    comments.forEach(comment => {
        console.log("COMMENT TO DELETE:", comment);
        comment.likes.forEach((commentLike, i) => {
            console.log("COMMENT LIKE TO DELETE:", commentLike);
            console.log("COMMENT LIKE TO DELETE:", i);
            console.log(
                "COMMENT LIKE TO DELETE:",
                commentLike.get("createdBy")
            );
            console.log(
                "COMMENT LIKE TO DELETE:",
                commentLike.get("createdBy").userId
            );

            const userId = ObjectId(commentLike.get("createdBy").userId);

            const query = User.updateOne(
                { _id: userId },
                {
                    $pull: {
                        likes: {
                            _id: commentLike._id,
                            docId: templateId,
                            coll: "template/comment"
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
                        docId: templateId,
                        coll: "template"
                    }
                }
            }
        );

        userPullPromises.push(query.exec());
    });

    follows.forEach(follow => {
        const userId = ObjectId(follow.get("userId"));

        const query = User.updateOne(
            { _id: userId },
            {
                $pull: {
                    templateReferences: {
                        templateId: templateId
                    }
                }
            }
        );

        userPullPromises.push(query.exec());
    });

    await Promise.all(userPullPromises);

    // Finally delete the template.
    const result = await Template.deleteOne({ _id: templateId }).exec();

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
            if (event.resource === "/template") {
                response = await queryTemplate(event);
            } else {
                response = await getTemplate(event);
            }
            break;
        case "POST":
            response = await createTemplate(event);
            break;
        case "PUT":
            response = await updateTemplate(event);
            break;
        case "DELETE":
            response = await deleteTemplate(event);
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
