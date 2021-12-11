const aws = require('aws-sdk');
const MongooseModels = require('/opt/nodejs/models');

exports.handler = async (event, context, callback) => {
    /* By default, the callback waits until the runtime event loop is empty before freezing the process and returning the results to the caller. Setting this property to false requests that AWS Lambda freeze the process soon after the callback is invoked, even if there are events in the event loop. AWS Lambda will freeze the process, any state data, and the events in the event loop. Any remaining events in the event loop are processed when the Lambda function is next invoked, if AWS Lambda chooses to use the frozen process. */
    context.callbackWaitsForEmptyEventLoop = false;

    console.log("EVENT", event);
    console.log("EVENT REQUEST:", event.request);
    console.log("VALIDATION DATA:", event.request.validationData);

    const { Parameters } = await (new aws.SSM())
    .getParameters({
        Names: ["MONGODB_URI"].map(secretName => process.env[secretName]),
        WithDecryption: true,
    })
    .promise();

    const MONGODB_URI = Parameters[0].Value;

    const User = await MongooseModels().User(MONGODB_URI);

    // Build new user
    const user = new User({
        username: event.userName,
        email: event.request.userAttributes.email,
        firstName: event.request.userAttributes.given_name,
        surname: event.request.userAttributes.family_name,
        gender: event.request.userAttributes.gender,
        dob: event.request.userAttributes.birthdate,
        country: event.request.userAttributes.locale,
        followerCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
        exercises: [],
        templates: [],
        workouts: [],
        likes: [],
        comments: [],
        postFeed: [],
        postReferences: [],
        options: {
            charts: {
                homepage: {
                    leftRail: [
                        {
                            type: "recentWorkouts",
                            startDate: {
                                unit: "week",
                                amount: 6,
                                date: null
                            },
                            endDate: {
                                unit: "",
                                amount: 0,
                                date: null
                            },
                            data: {
    
                            },
                            interval: "week",
                            backgroundColor: "#007bff",
                            borderColor: "#007bff",
                            pointBackgroundColor: "#007bff"
                        }
                    ],
                    rightRail: []
                },
                profile: {
                    leftRail: [
                        {
                            type: "recentWorkouts",
                            startDate: {
                                unit: "week",
                                amount: 6,
                                date: null
                            },
                            endDate: {
                                unit: "",
                                amount: 0,
                                date: null
                            },
                            data: {
    
                            },
                            interval: "week",
                            backgroundColor: "#007bff",
                            borderColor: "#007bff",
                            pointBackgroundColor: "#007bff"
                        }
                    ],
                    rightRail: []
                }
            }
        }
    });

    await user.save().catch(err => {
        callback(err, event);
    });

    callback(null, event);
}