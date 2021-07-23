const MongooseModels = require('/opt/models')

exports.handler = async (event, context, callback) => {
    let userForm = JSON.parse(event.body).signUpForm;
    const User = (await MongooseModels(MONGODB_URI)).User;

    // Check user doesn't already exist.
    const existingUser = await User.findOne({ username: event.request.userName });

    if (existingUser) {
        let denyError = new Error("Username already exists.");
        callback(denyError, event);
    }

    // Build new user
    const user = new User({
        username: event.userName,
        email: event.request.userAttributes.email,
        firstName: event.request.userAttributes.given_name,
        surname: event.request.userAttributes.family_name,
        gender: event.request.userAttributes.gender,
        dob: event.request.userAttributes.birthdate,
        height: event.request.userAttributes['custom:height'],
        weight: event.request.userAttributes['custom:weight'],
        metric: (event.request.userAttributes['custom:metric'] === "true"),
        country: event.request.userAttributes.locale,
        profilePhoto: event.request.userAttributes.picture,
        followerCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
        exercises: [],
        templates: [],
        workouts: [],
        workouts: [],
        likes: [],
        comments: []
    });

    const result = await user.save().catch(() => {
        let denyError = new Error("Error creating document.");
        callback(denyError, event);
    });

    callback(null, event);
}