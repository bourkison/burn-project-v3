const mongoose = require("./nodejs/node_modules/mongoose");

const mongooseConnect = require("./mongoose-connection");
const ObjectId = mongoose.Types.ObjectId;

mongoose.set("debug", (collectionName, methodName, ...methodArgs) => {
    console.log("MONGOOSE", collectionName, methodName, methodArgs);
    console.log("MONGOOSE STRINGIFIED:", collectionName, methodName, JSON.stringify(methodArgs));
});

const userReferenceSchema = new mongoose.Schema(
    {
        userId: {
            type: ObjectId,
            required: true
        },
        username: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

const exerciseReferenceSchema = new mongoose.Schema(
    {
        exerciseId: {
            type: ObjectId,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        muscleGroups: {
            type: [String],
            default: []
        },
        tags: {
            type: [String],
            default: []
        },
        isFollow: {
            type: Boolean,
            required: false
        },
        createdBy: {
            type: userReferenceSchema,
            required: true
        }
    },
    { timestamps: true }
);

const postReferenceSchema = new mongoose.Schema(
    {
        createdBy: {
            type: userReferenceSchema,
            required: true
        }
    },
    { timestamps: true }
);

const templateReferenceSchema = new mongoose.Schema(
    {
        templateId: {
            type: ObjectId,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        muscleGroups: {
            type: [String],
            default: []
        },
        tags: {
            type: [String],
            default: []
        },
        isFollow: {
            type: Boolean,
            required: false
        },
        createdBy: {
            type: userReferenceSchema,
            required: true
        }
    },
    { timestamps: true }
);

const commentReferenceSchema = new mongoose.Schema(
    {
        coll: {
            type: String,
            required: true
        },
        docId: {
            type: ObjectId,
            required: true
        }
    },
    { timestamps: true }
);

const likeReferenceSchema = new mongoose.Schema(
    {
        coll: {
            type: String,
            required: true
        },
        docId: {
            type: ObjectId,
            required: true
        },
        commentId: {
            type: ObjectId,
            default: null
        }
    },
    { timestamps: true }
);

const recordedSetSchema = new mongoose.Schema(
    {
        kg: {
            type: Number,
            default: 0
        },
        measureAmount: {
            type: Number,
            default: 0
        },
        measureBy: {
            type: String,
            required: true
        }
    },
    { timestamps: false }
);

const recordedExerciseSchema = new mongoose.Schema(
    {
        sets: {
            type: [recordedSetSchema],
            default: []
        },
        exerciseReference: {
            type: exerciseReferenceSchema,
            required: true
        },
        notes: {
            type: String,
            default: ""
        },
        options: {
            type: Map,
            default: {}
        }
    },
    { timestamps: false }
);

const likeSchema = new mongoose.Schema(
    {
        createdBy: {
            type: userReferenceSchema,
            required: true
        }
    },
    { timestamps: true }
);

const workoutSchema = new mongoose.Schema(
    {
        duration: {
            type: Number,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        notes: {
            type: String,
            default: ""
        },
        recordedExercises: {
            type: [recordedExerciseSchema],
            default: []
        },
        uniqueExercises: {
            type: [String],
            default: []
        },
        templateReference: {
            type: templateReferenceSchema,
            default: null
        },
        options: {
            type: Map,
            default: {}
        }
    },
    { timestamps: true }
);

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        createdBy: {
            type: userReferenceSchema,
            required: true
        },
        likes: {
            type: [likeSchema],
            default: []
        },
        likeCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const postSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        createdBy: {
            type: userReferenceSchema,
            required: true
        },
        filePaths: {
            type: [String],
            required: true
        },
        share: {
            type: Map,
            default: {}
        },
        likes: {
            type: [likeSchema],
            default: []
        },
        likeCount: {
            type: Number,
            default: 0
        },
        comments: {
            type: [commentSchema],
            default: []
        },
        commentCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        surname: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            required: true
        },
        dob: {
            type: String,
            required: true
        },
        height: {
            type: Number,
            default: 0
        },
        weight: {
            type: Number,
            default: 0  
        },
        metric: {
            type: Boolean,
            default: true
        },
        country: {
            type: String,
            required: true
        },
        profilePhoto: {
            type: String,
            default: ""
        },
        followerCount: {
            type: Number,
            default: 0
        },
        followingCount: {
            type: Number,
            default: 0
        },
        followers: {
            type: [userReferenceSchema],
            default: []
        },
        following: {
            type: [userReferenceSchema],
            default: []
        },
        exerciseReferences: {
            type: [exerciseReferenceSchema],
            default: []
        },
        templateReferences: {
            type: [templateReferenceSchema],
            default: []
        },
        workouts: {
            type: [workoutSchema],
            default: []
        },
        likes: {
            type: [likeReferenceSchema],
            default: []
        },
        comments: {
            type: [commentReferenceSchema],
            default: []
        },
        postReferences: {
            type: [postReferenceSchema],
            default: []
        },
        postFeed: {
            type: [postReferenceSchema],
            default: []
        },
        options: {
            type: Map,
            required: true
        }
    },
    { timestamps: true }
);

const exerciseSchema = new mongoose.Schema(
    {
        createdBy: {
            type: userReferenceSchema,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        difficulty: {
            type: Number,
            required: true
        },
        measureBy: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        filePaths: {
            type: [String],
            required: []
        },
        muscleGroups: {
            type: [String],
            required: []
        },
        tags: {
            type: [String],
            default: []
        },
        likes: {
            type: [likeSchema],
            default: []
        },
        comments: {
            type: [commentSchema],
            default: []
        },
        follows: {
            type: [userReferenceSchema],
            default: []
        },
        likeCount: {
            type: Number,
            default: 0
        },
        commentCount: {
            type: Number,
            default: 0
        },
        followCount: {
            type: Number,
            default: 0
        },
        templateReferences: {
            type: [templateReferenceSchema],
            default: []
        }
    },
    { timestamps: true }
);

const templateSchema = new mongoose.Schema(
    {
        createdBy: {
            type: userReferenceSchema,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        difficulty: {
            type: Number,
            required: true
        },
        exerciseReferences: {
            type: [exerciseReferenceSchema],
            default: []
        },
        muscleGroups: {
            type: [String],
            default: []
        },
        name: {
            type: String,
            required: true
        },
        tags: {
            type: [String],
            default: []
        },
        likes: {
            type: [likeSchema],
            default: []
        },
        likeCount: {
            type: Number,
            default: 0
        },
        comments: {
            type: [commentSchema],
            default: []
        },
        commentCount: {
            type: Number,
            default: 0
        },
        follows: {
            type: [userReferenceSchema],
            default: []
        },
        followCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = async uri => {
    const connection = await mongooseConnect(uri);

    const User = connection.model("User", userSchema);
    const Exercise = connection.model("Exercise", exerciseSchema);
    const Template = connection.model("Template", templateSchema);
    const Post = connection.model("Post", postSchema);

    return { User, Exercise, Post, Template };
};
