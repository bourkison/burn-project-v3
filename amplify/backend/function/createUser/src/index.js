const mongooseModels = require('/opt/models');

const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async (event, context) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;

    let userForm = JSON.parse(event.body).signUpForm;
    const User = (await mongooseModels(MONGODB_URI)).User;

    // Check user doesn't already exist.
    const existingUser = await User.findOne({ username: userForm.username });

    if (existingUser) {
        const errorResponse = "User already exists";

        const response = {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: errorResponse }),
        };
    
        return response;
    }

    // Build new user
    const user = new User({
        username: userForm.username,
        email: userForm.email,
        firstName: userForm.firstName,
        surname: userForm.surname,
        gender: userForm.gender,
        dob: userForm.dob,
        height: userForm.height,
        weight: userForm.weight,
        metric: userForm.metric,
        country: userForm.country
    });

    const result = await user.save();

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify({ acknowledged: true, _id: result._id }),
    };

    return response;
};
