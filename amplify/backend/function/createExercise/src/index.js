const mongooseModels = require('/opt/models');
const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the exerciseResults to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;

    let exerciseForm = JSON.parse(event.body).exerciseForm;

    const User = (await mongooseModels(MONGODB_URI)).User;
    const Exercise = (await mongooseModels(MONGODB_URI)).Exercise;

    // First pull user data.
    let fields = 'username'
    const user = await User.findOne({ username: event.requestContext.authorizer.claims['cognito:username'] }, fields).exec();

    if (!user) {
        const errorResponse = "Error finding user: " + event.requestContext.authorizer.claims['cognito:username'] + ".\n" + JSON.stringify(event.requestContext.authorizer);

        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: errorResponse}),
        }

        return response;
    }

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
    })

    const exerciseResult = await exercise.save().catch(err => {
        const errorResponse = "Error creating exercise: " + JSON.stringify(err);
        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: errorResponse }),
        }

        return response;
    });

    const userExercise = {
        exerciseId: exerciseResult._id,
        name: exerciseResult.name,
        muscleGroups: exerciseResult.muscleGroups,
        tags: exerciseResult.tags,
        isFollow: false
    }

    const userResult = await User.updateOne({ _id: user._id }, { $push: { exerciseReferences: userExercise }}).catch(err => {
        // TODO: Delete previously created exercise.
        const errorResponse = "Error creating exercise in user document: " + JSON.stringify(err);
        const response = {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: errorResponse }),
        }

        return response;
    });

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify({ acknowledged: true, _id: exerciseResult._id }),
    }

    return response;
}