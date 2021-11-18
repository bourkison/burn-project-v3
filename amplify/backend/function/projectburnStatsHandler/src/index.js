const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const projections = require("./projections")

let MONGODB_URI;

// GET request /stats
const getStats = async function(event) {
    let response;

    switch (event.pathParameters.proxy) {
        case "recentworkouts":
            response = await amountWorkouts(event);
            break;
        case "exercise":
            response = await exerciseStats(event);
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

const amountWorkouts = async function(event) {
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
                    workouts: projections.workouts(startDate, endDate)
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
    let responseData = { recentWorkouts: {} };
    workoutResult.forEach(workout => {
        // Convert to yyyy-mm-dd
        let d = new Date(workout.createdAt);
        let mm = d.getMonth() + 1;
        let dd = d.getDate();

        let s = [d.getFullYear(), (mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("-");

        responseData.recentWorkouts[s] = responseData.recentWorkouts[s] ? responseData.recentWorkouts[s] + 1 : 1;
    });

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: { stats: responseData }
    });

    return response;
};

const exerciseStats = async function(event) {
    let exerciseId = event.queryStringParameters.exerciseId || "";
    let username = event.queryStringParameters.username;
    let preferenceIndex = event.queryStringParameters.preferenceIndex || 0;
    let dataToPull = event.queryStringParameters.dataToPull ? event.queryStringParameters.dataToPull.split(",") : ["orm"];

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
        exerciseId = (await User.aggregate(projections.orderedExercisesAggregation(username)))[preferenceIndex]._id;
    }

    // First filters down the input to where uniqueExercises includes exerciseId,
    // then maps the exerciseReference array to only include exerciseId,
    // then maps the entire array to only include createdAt and recordedExercises
    let workoutResult = (
        await User.aggregate([
            {
                $match: { username: username }
            },
            {
                $project: {
                    workouts: projections.exercises(exerciseId)
                }
            }
        ])
    )[0];

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

    if (dataToPull.includes("orm")) {
        responseData.orm = {};
    }

    if (dataToPull.includes("totalReps")) {
        responseData.totalReps = {};
    }

    if (dataToPull.includes("totalVolume")) {
        responseData.totalVolume = {};
    }

    workoutResult.forEach(workout => {
        let maxOrm = 0;
        let totalReps = 0;
        let totalVolume = 0;

        workout.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                if (set.measureBy === "kg") {
                    let orm = calcORM(set.kg, set.measureAmount);

                    if (orm > maxOrm) {
                        maxOrm = orm;
                    }

                    totalVolume += set.measureAmount * set.kg;
                }

                totalReps += set.measureAmount;
            });
        });

        // Convert to yyyy-mm-dd
        let d = new Date(workout.createdAt);
        let mm = d.getMonth() + 1;
        let dd = d.getDate();

        let s = [d.getFullYear(), (mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("-");

        if (dataToPull.includes("orm")) {
            if (!responseData.orm[s] || maxOrm > responseData.orm[s]) {
                responseData.orm[s] = maxOrm;
            }
        }

        if (dataToPull.includes("totalReps")) {
            if (responseData.totalReps[s]) {
                responseData.totalReps[s] += totalReps;
            } else {
                responseData.totalReps[s] = totalReps;
            }
        }

        if (dataToPull.includes("totalVolume")) {
            if (responseData.totalVolume[s]) {
                responseData.totalVolume[s] += totalVolume;
            } else {
                responseData.totalVolume[s] = totalVolume;
            }
        }
    });

    let exerciseName;
    if (workoutResult.length && workoutResult[0].exercises.length) {
        exerciseName = workoutResult[0].exercises[0].exerciseReference.name;
    }

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true,
        data: { stats: responseData, exerciseName: exerciseName }
    });

    return response;
};

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
};


// PUT request /stats/{proxy+}
const updateChart = async function(event) {
    const position = event.pathParameters.proxy;
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const index = JSON.parse(event.body).index;
    const options = JSON.parse(event.body).options;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
            success: false
        })
    }

    let setObj = {};
    let key = "";

    switch (position) {
        case "homepageLeftRail":
            key = "options.charts.homepage.leftRail." + index
            break;
        case "profileLeftRail":
            key = "options.charts.profile.leftRail." + index
            break;
    }

    setObj[key] = options

    const User = (await MongooseModels(MONGODB_URI)).User;

    await User.updateOne(
        {
            username: username
        },
        {
            $set: setObj
        }
    )

    response.statusCode = 200;
    response.body = JSON.stringify({
        success: true
    })

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
            response = await getStats(event);
            break;
        case "PUT":
            response = await updateChart(event);
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
