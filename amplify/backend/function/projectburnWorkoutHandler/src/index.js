const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let MONGODB_URI;

// GET request /workout/{proxy+}
const getWorkout = async function(event) {
    const workoutId = ObjectId(event.pathParameters.proxy);
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const User = (await MongooseModels(MONGODB_URI)).User;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    const result = (await User.findOne(
        {
            username: username
        },
        {
            workouts: {
                $elemMatch: {
                    _id: workoutId
                }
            }
        }
    )).workouts[0];

    if (!result) {
        const errorResponse = "Workout: " + workoutId + " not found.";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: result });

    return response;
};

// GET request /workout
const queryWorkout = async function(event) {
    const username = event.requestContext.authorizer.claims["cognito:username"];
    const loadAmount = event.queryStringParameters.loadAmount
        ? Number(event.queryStringParameters.loadAmount)
        : 5;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    const User = (await MongooseModels(MONGODB_URI)).User;

    const result = (await User.findOne(
        {
            username: username
        },
        {
            workouts: {
                $slice: ["$workouts", 0 - loadAmount]
            }
        }
    )).workouts.reverse();

    if (!result || !result.length) {
        const errorResponse = "Workouts not found for user: " + username + ".";
        response.statusCode = 404;
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });
    }

    response.statusCode = 200;
    response.body = JSON.stringify({ success: true, data: result });

    return response;
};

// POST request
const createWorkout = async function(event) {
    let workoutForm = JSON.parse(event.body).workoutForm;
    const username = event.requestContext.authorizer.claims["cognito:username"];

    const User = (await MongooseModels(MONGODB_URI)).User;

    let response = {
        statusCode: 500,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ success: false })
    };

    let recordedExercises = [];

    workoutForm.recordedExercises.forEach(exercise => {
        let recordedSets = [];

        exercise.sets.forEach(set => {
            recordedSets.push({
                kg: set.kg,
                measureAmount: set.measureAmount,
                measureBy: set.measureBy
            });
        });

        let exerciseReference = {
            exerciseId: ObjectId(exercise.exerciseReference.exerciseId),
            name: exercise.exerciseReference.name,
            muscleGroups: exercise.exerciseReference.muscleGroups,
            tags: exercise.exerciseReference.tags
        };

        recordedExercises.push({
            sets: recordedSets,
            exerciseReference: exerciseReference,
            notes: exercise.notes
        });
    });

    let workout = {
        duration: Number(workoutForm.duration),
        name: workoutForm.name,
        notes: workoutForm.notes,
        recordedExercises: recordedExercises,
        uniqueExercises: workoutForm.uniqueExercises
    };

    if (workoutForm.templateReference) {
        workout.templateReference = workoutForm.templateReference;
    } else {
        workout.templateReference = null;
    }
    let userResult;
    try {
        userResult = await User.updateOne(
            { username: username },
            { $push: { workouts: workout } }
        );

        response.statusCode = 200;
        response.body = JSON.stringify({
            success: true,
            data: { workout: workout, response: userResult }
        });

        return response;
    } catch (err) {
        console.error("Error creating USER:", err);
        const errorResponse = "Error creating workout.";
        response.body = JSON.stringify({
            success: false,
            errorMessage: errorResponse
        });

        return response;
    }
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
            if (event.resource === "/workout") {
                response = await queryWorkout(event);
            } else {
                response = await getWorkout(event);
            }
            break;
        case "POST":
            response = await createWorkout(event);
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
