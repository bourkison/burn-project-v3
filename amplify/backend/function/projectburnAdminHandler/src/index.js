const aws = require("aws-sdk");
const MongooseModels = require("/opt/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const faker = require("faker");
let MONGODB_URI;

const randomMuscleGroups = function(n) {
    let availableMuscleGroups = [
        "Trapezius",
        "Deltoids",
        "Forearms",
        "Lats",
        "Abs",
        "Obliques",
        "Pectorals",
        "Adductors",
        "Calves",
        "Hamstrings",
        "Glutes",
        "Quads",
        "Triceps",
        "Biceps"
    ];

    let selectedMuscleGroups = [];

    for (let i = 0; i < n; i ++ ) {
        const muscleGroup = availableMuscleGroups[Math.floor(Math.random() * availableMuscleGroups.length)];
        selectedMuscleGroups.push(muscleGroup);
        availableMuscleGroups = availableMuscleGroups.filter(x => x !== muscleGroup);
    }

    return selectedMuscleGroups
}

const randomTags = function(n) {
    let tags = [];

    for (let i = 0; i < n; i ++) {
        tags.push(faker.animal.dog());
    }

    return tags;
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

    const User = (await MongooseModels(MONGODB_URI)).User;
    // const Post = (await MongooseModels(MONGODB_URI)).Post;
    const Exercise = (await MongooseModels(MONGODB_URI)).Exercise;
    const Template = (await MongooseModels(MONGODB_URI)).Template;
    
    const databaseForm = JSON.parse(event.body).databaseForm;
    console.log("DATABASE FORM:", databaseForm);

    let exercisesToCreate = databaseForm.userAmount * databaseForm.exerciseAmount;
    console.log("EXERCISES TO CREATE:", exercisesToCreate);

    let templatesToCreate = databaseForm.userAmount * databaseForm.templateAmount;
    console.log("TEMPLATES TO CREATE:", templatesToCreate);

    let exercisePromises = [];
    let exerciseReferencePromises = [];
    let templatePromises = [];
    let templateReferencePromises = [];

    let createdExercises = [];
    let createdTemplates = [];

    // First create exercises.
    for (let i = 0; i < databaseForm.usernames.length; i ++) {
        const username = databaseForm.usernames[i].toLowerCase();
        console.log("USERNAME for EXERCISE:", username, i);
        const user = await User.findOne({ username: username }, { username: 1 }).exec();

        console.log("ID:", user._id);

        let userReference = {
            userId: ObjectId(user._id),
            username: username
        }

        let exerciseAmount = Math.floor(Math.random() * databaseForm.exerciseAmount) * 2;

        if (exerciseAmount > exercisesToCreate) {
            exerciseAmount = exercisesToCreate;
        }

        for (let j = 0; j < exerciseAmount; j ++) {
            const createdAt = faker.date.past(1);
            const _id = new ObjectId();
            const muscleGroups = randomMuscleGroups(Math.floor(Math.random() * 10) + 1);
            const tags = randomTags(Math.floor(Math.random() * 6));
            const name = faker.vehicle.vehicle();
            let filePaths = [];
    
            for (let k = 0; k < Math.floor(Math.random() * 5); k ++) {
                filePaths.push("test/" + Math.floor(Math.random() * 25) + ".jpg");
            }

            userReference.createdAt = createdAt;
            userReference.updatedAt = createdAt;

            const exerciseObject = {
                _id: _id,
                createdBy: userReference,
                createdAt: createdAt,
                updatedAt: createdAt,
                description: faker.lorem.paragraphs(),
                difficulty: Math.floor(Math.random() * 5) + 1,
                filePaths: filePaths,
                measureBy: "kg",
                muscleGroups: muscleGroups,
                name: name,
                tags: tags,
                follows: [userReference],
                followCount: 1
            }

            createdExercises.push(exerciseObject)
    
            const exercise = new Exercise(exerciseObject)

            exercisePromises.push(exercise.save());
            
            const exerciseReference = {
                exerciseId: _id,
                muscleGroups: muscleGroups,
                tags: tags,
                isFollow: false,
                name: name,
                createdBy: userReference,
                createdAt: createdAt,
                updatedAt: createdAt
            }

            console.log("_ID:", _id);
            console.log("EXERCISE REFERENCE", exerciseReference);

            exerciseReferencePromises.push(User.update(
                {
                    username: username
                },
                {
                    $push: {
                        exerciseReferences: exerciseReference
                    }
                }
            ));
            
            exercisesToCreate --;
        }
    }

    await Promise.all(exercisePromises);
    await Promise.all(exerciseReferencePromises);

    // Next create templates.
    for (let i = 0; i < databaseForm.usernames.length; i ++) {
        const username = databaseForm.usernames[i].toLowerCase();

        const user = await User.findOne({ username: username }, { username: 1 }).exec();

        let userReference = {
            userId: ObjectId(user._id),
            username: username
        }

        let templateAmount = Math.floor(Math.random() * databaseForm.templateAmount) * 2;

        if (templateAmount > templatesToCreate) {
            templateAmount = templatesToCreate
        }

        console.log("TEMPLATE AMOUNT:", templateAmount, "FOR USERNAME:", username);

        for (let j = 0; j < templateAmount; j++) {
            const createdAt = faker.date.past(1);
            const _id = new ObjectId();
            const muscleGroups = randomMuscleGroups(Math.floor(Math.random() * 10) + 1);
            const tags = randomTags(Math.floor(Math.random() * 6));
            const name = faker.vehicle.vehicle();

            userReference.createdAt = createdAt;
            userReference.updatedAt = createdAt;

            let exerciseReferences = [];

            for (let k = 0; k < (Math.floor(Math.random() * 8) + 1); k ++) {
                const exercise = createdExercises[Math.floor(Math.random() * createdExercises.length)];

                const exerciseReference = {
                    exerciseId: exercise._id,
                    muscleGroups: exercise.muscleGroups,
                    tags: exercise.tags,
                    name: exercise.name,
                    createdBy: exercise.createdBy,
                    createdAt: createdAt,
                    updatedAt: createdAt
                }

                exerciseReferences.push(exerciseReference);
            }

            const templateObject = {
                _id: _id,
                createdBy: userReference,
                createdAt: createdAt,
                updatedAt: createdAt,
                description: faker.lorem.paragraphs(),
                difficulty: Math.floor(Math.random() * 5) + 1,
                exerciseReferences: exerciseReferences,
                muscleGroups: muscleGroups,
                name: name,
                tags: tags,
                follows: [userReference],
                followCount: 1
            }

            createdTemplates.push(templateObject)

            const template = new Template(templateObject);

            templatePromises.push(template.save());

            const templateReference = {
                templateId: _id,
                muscleGroups: muscleGroups,
                tags: tags,
                isFollow: false,
                name: name,
                createdBy: userReference,
                createdAt: createdAt,
                updatedAt: createdAt
            };

            templateReferencePromises.push(User.update(
                {
                    username: username
                },
                {
                    $push: {
                        templateReferences: templateReference
                    }
                }
            ));

            templatesToCreate --;
        }
    }

    await Promise.all(templatePromises);
    await Promise.all(templateReferencePromises);

    response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify("Hello from Lambda!")
    };
    return response;
};
