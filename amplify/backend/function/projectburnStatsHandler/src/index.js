const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

let MONGODB_URI;

// GET request /stats
const getStats = async function(event) {
    let response;

    switch (event.pathParameters.proxy) {
        case "recentworkouts":
            response = await getRecentWorkouts(event);
            break;
        case "onerepmax":
            response = await getOneRepMax(event);
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

const getRecentWorkouts = async function(event) {
    let startDate = event.queryStringParameters.startDate;
    let endDate = event.queryStringParameters.endDate;
    let username = event.queryStringParameters.username;

    startDate = isNaN(Number(startDate)) ? new Date(startDate) : new Date(Number(startDate));
    endDate = isNaN(Number(endDate)) ? new Date(endDate) : new Date(Number(endDate));

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    const User = (await MongooseModels(MONGODB_URI)).User;

    let workoutResult = (
        await User.aggregate([
            {
                $match: { username: username }
            },
            {
                $project: {
                    workouts: {
                        $map: {
                            input: {
                                $filter: {
                                    input: "$workouts",
                                    as: "w",
                                    cond: {
                                        $and: [
                                            { $gte: ["$$w.createdAt", startDate] },
                                            { $lte: ["$$w.createdAt", endDate] }
                                        ]
                                    }
                                }
                            },
                            as: "w",
                            in: {
                                createdAt: "$$w.createdAt"
                            }
                        }
                    }
                }
            }
        ])
    )[0];

    if (!workoutResult) {
        const errorResponse = "Workouts not found for username: " + username;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    workoutResult = workoutResult.workouts;

    // Data is object with date as key and amount in that date as value.
    let responseData = {};
    workoutResult.forEach(workout => {
        // Convert to yyyy-mm-dd
        let d = new Date(workout.createdAt);
        let mm = d.getMonth() + 1;
        let dd = d.getDate();

        let s = [d.getFullYear(), (mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("-");

        responseData[s] = responseData[s] ? responseData[s] + 1 : 1;
    });

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: responseData
    });

    return response;
};

const getOneRepMax = async function(event) {
    let exerciseId = event.queryStringParameters.exerciseId || "";
    let username = event.queryStringParameters.username;
    let exerciseIndex = event.queryStringParameters.exerciseIndex || 0;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    const User = (await MongooseModels(MONGODB_URI)).User;

    if (!exerciseId) {
        exerciseId = (await orderExercises(event))[exerciseIndex];
    }

    // First filters down the input to where uniqueExercises includes exerciseId, 
    // then maps the exerciseReference array to only include exerciseId,
    // then maps the entire array to only include createdAt and recordedExercises
    let workoutResult = (await User.aggregate([
        {
            $match: { username: username }
        },
        {
            $project: {
                workouts: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$workouts",
                                as: "w",
                                cond: {
                                    $in: [exerciseId, "$$w.uniqueExercises"]
                                }
                            }
                        },
                        as: "w",
                        in: {
                            createdAt: "$$w.createdAt",
                            exercises: {
                                $filter: {
                                    input: "$$w.recordedExercises",
                                    as: "r",
                                    cond: {
                                        $eq: [
                                            "$$r.exerciseReference.exerciseId",
                                            ObjectId(exerciseId)
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ]))[0];

    if (!workoutResult) {
        const errorResponse = "Exercises not found for username: " + username;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }

    workoutResult = workoutResult.workouts;

    
    // Data is object with date as key and highest one rep max for that date as value.
    let responseData = {};
    workoutResult.forEach(workout => {
        let maxOrm = 0;

        workout.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                if (set.measureBy === "kg") {
                    let orm = calcORM(set.kg, set.measureAmount);

                    if (orm > maxOrm) {
                        maxOrm = orm;
                    }
                }
            })

        })

        // Convert to yyyy-mm-dd
        let d = new Date(workout.createdAt);
        let mm = d.getMonth() + 1;
        let dd = d.getDate();

        let s = [d.getFullYear(), (mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("-");

        if (!responseData[s] || maxOrm > responseData[s]) {
            responseData[s] = maxOrm;
        }
    });

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: responseData
    })

    return response;
};

const orderExercises = async function() {
    return ["6106652690f6f5000859c924"];
}

const calcORM = function(amount, reps) {
    if (reps >= 30) {
        return amount / 0.5;
    } else if (reps <= 0 || amount <= 0) {
        return 0;
    }

    switch (reps) {
        case 1:
            return Math.round(amount * 2) / 2;
        case 2:
            return Math.round((amount / 0.97) * 2) / 2;
        case 3:
            return Math.round((amount / 0.94) * 2) / 2;
        case 4:
            return Math.round((amount / 0.92) * 2) / 2;
        case 5:
            return Math.round((amount / 0.89) * 2) / 2;
        case 6:
            return Math.round((amount / 0.86) * 2) / 2;
        case 7:
            return Math.round((amount / 0.83) * 2) / 2;
        case 8:
            return Math.round((amount / 0.81) * 2) / 2;
        case 9:
            return Math.round((amount / 0.78) * 2) / 2;
        case 10:
            return Math.round((amount / 0.75) * 2) / 2;
        case 11:
            return Math.round((amount / 0.73) * 2) / 2;
        case 12:
            return Math.round((amount / 0.71) * 2) / 2;
        case 13:
            return Math.round((amount / 0.7) * 2) / 2;
        case 14:
            return Math.round((amount / 0.68) * 2) / 2;
        case 15:
            return Math.round((amount / 0.67) * 2) / 2;
        case 16:
            return Math.round((amount / 0.65) * 2) / 2;
        case 17:
            return Math.round((amount / 0.64) * 2) / 2;
        case 18:
            return Math.round((amount / 0.63) * 2) / 2;
        case 19:
            return Math.round((amount / 0.61) * 2) / 2;
        case 20:
            return Math.round((amount / 0.6) * 2) / 2;
        case 21:
            return Math.round((amount / 0.59) * 2) / 2;
        case 22:
            return Math.round((amount / 0.58) * 2) / 2;
        case 23:
            return Math.round((amount / 0.57) * 2) / 2;
        case 24:
            return Math.round((amount / 0.56) * 2) / 2;
        case 25:
            return Math.round((amount / 0.55) * 2) / 2;
        case 26:
            return Math.round((amount / 0.54) * 2) / 2;
        case 27:
            return Math.round((amount / 0.53) * 2) / 2;
        case 28:
            return Math.round((amount / 0.52) * 2) / 2;
        case 29:
            return Math.round((amount / 0.51) * 2) / 2;
    }
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
            response = await getStats(event);
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
