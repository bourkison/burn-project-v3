const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const mongooseConnect = require("./mongoose-connection");

const emailValidator = require("email-validator");

const countryListEnum = ["Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas (the)", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia (Plurinational State of)", "Bonaire int Eustatius and Saba", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory (the)", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Cayman Islands (the)", "Central African Republic (the)", "Chad", "Chile", "China", "Christmas Island", "Cocos (Keeling) Islands (the)", "Colombia", "Comoros (the)", "Congo (the Democratic Republic of the)", "Congo (the)", "Cook Islands (the)", "Costa Rica", "Croatia", "Cuba", "Curaçao", "Cyprus", "Czechia", "Côte d'Ivoire", "Denmark", "Djibouti", "Dominica", "Dominican Republic (the)", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Falkland Islands (the) [Malvinas]", "Faroe Islands (the)", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories (the)", "Gabon", "Gambia (the)", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard Island and McDonald Islands", "Holy See (the)", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran (Islamic Republic of)", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea (the Democratic People's Republic of)", "Korea (the Republic of)", "Kuwait", "Kyrgyzstan", "Lao People's Democratic Republic (the)", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands (the)", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia (Federated States of)", "Moldova (the Republic of)", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands (the)", "New Caledonia", "New Zealand", "Nicaragua", "Niger (the)", "Nigeria", "Niue", "Norfolk Island", "Northern Mariana Islands (the)", "Norway", "Oman", "Pakistan", "Palau", "Palestine tate of", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines (the)", "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "Republic of North Macedonia", "Romania", "Russian Federation (the)", "Rwanda", "Réunion", "Saint Barthélemy", "Saint Helena scension and Tristan da Cunha", "Saint Kitts and Nevis", "Saint Lucia", "Saint Martin (French part)", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten (Dutch part)", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia and the South Sandwich Islands", "South Sudan", "Spain", "Sri Lanka", "Sudan (the)", "Suriname", "Svalbard and Jan Mayen", "Sweden", "Switzerland", "Syrian Arab Republic", "Taiwan", "Tajikistan", "Tanzania nited Republic of", "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands (the)", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates (the)", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela (Bolivarian Republic of)", "Vietnam", "Virgin Islands (British)", "Virgin Islands (U.S.)", "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe", "Åland Islands"]
const reservedUsernamesEnum = ["exercise", "exercises", "template", "templates", "workout", "workouts", "search", "yoga", "diet"];
const measureByEnum = ["repsWeight", "reps", "timeWeight", "time"];

mongoose.set("debug", (collectionName, methodName, ...methodArgs) => {
    console.log("MONGOOSE", collectionName, methodName, methodArgs);
    console.log("MONGOOSE STRINGIFIED:", collectionName, methodName, JSON.stringify(methodArgs));
});

// Used to allow partial text search
const createEdgeNGrams = function(str, min) {
    if (str && str.length > min) {
        const minGram = min
        const maxGram = str.length
        
        return str.split(" ").reduce((ngrams, token) => {
            if (token.length > minGram) {   
                for (let i = minGram; i <= maxGram && i <= token.length; ++i) {
                    ngrams = [...ngrams, token.substr(0, i)]
                }
            } else {
                ngrams = [...ngrams, token]
            }
            return ngrams
        }, []).join(" ")
    } 
    
    return str;
}

const chart = {
    chartType: {
        type: String,
        required: true,
        enum: ["recentWorkouts", "exercise"]
    },
    startDate: {
        unit: {
            type: String,
            default: "",
            enum: ["", "day", "week", "month"]
        },
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        date: {
            type: Date,
            default: null,
            validate: {
                validator(d) {
                    if (d !== null &&isNaN(Date.parse(d))) {
                        return false;
                    }

                    return true;
                }
            }
        }
    },
    endDate: {
        unit: {
            type: String,
            default: "",
            enum: ["", "day", "week", "month"]
        },
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        date: {
            type: Date,
            default: null,
            validate: {
                validator(d) {
                    if (d !== null &&isNaN(Date.parse(d))) {
                        return false;
                    }

                    return true;
                }
            }
        }
    },
    interval: {
        type: String,
        required: true,
        enum: ["day", "week", "month"]
    },
    backgroundColor: {
        type: String,
        required: true,
        validate: {
            validator(c) {
                if (!/#[0-9A-Fa-f]{6}/g.test(c)) {
                    return false;
                }

                return true;
            }
        }
    },
    borderColor: {
        type: String,
        required: true,
        validate: {
            validator(c) {
                if (!/#[0-9A-Fa-f]{6}/g.test(c)) {
                    return false;
                }

                return true;
            }
        }
    },
    pointBackgroundColor: {
        type: String,
        required: true,
        validate: {
            validator(c) {
                if (!/#[0-9A-Fa-f]{6}/g.test(c)) {
                    return false;
                }

                return true;
            }
        }
    },
    data: {
        preferenceIndex: {
            type: Number,
            required: false
        }
    }
}

// USED IN TEMPLATES & WORKOUTS
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
        createdBy: {
            username: {
                type: String,
                requireed: true
            },
            userId: {
                type: String,
                required: true
            }
        },
        createdAt: {
            type: Date,
            required: true
        }
    },
    { timestamps: false }
);

const postReferenceSchema = new mongoose.Schema(
    {
        createdBy: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: ObjectId,
                required: true
            }
        },
        createdAt: {
            type: Date,
            required: true
        }
    },
    { timestamps: false }
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
        createdBy: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: ObjectId,
                required: true
            }
        },
        createdAt: {
            type: Date,
            required: true
        }
    },
    { timestamps: false }
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
        },
        createdAt: {
            type: Date,
            required: true
        }
    },
    { timestamps: false }
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
        },
        createdAt: {
            type: Date,
            required: true
        }
    },
    { timestamps: false }
);

const recordedSetSchema = new mongoose.Schema(
    {
        weightAmount: {
            type: Number,
            default: 0
        },
        measureAmount: {
            type: Number,
            default: 0
        },
        measureBy: {
            type: String,
            required: true,
            enum: measureByEnum
        }
    },
    { timestamps: false }
);

const likeSchema = new mongoose.Schema(
    {
        createdBy: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: ObjectId,
                required: true
            }
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
            type: [{
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
                    measureBy: {
                        type: String,
                        default: "repsWeight",
                        enum: measureByEnum
                    },
                    weightUnit: {
                        type: String,
                        default: "kg",
                        enum: ["kg", "lb"]
                    }
                }
            }],
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
            charts: {
                type: [chart],
                default: []
            }
        },
        public: {
            type: Boolean,
            default: true
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
            username: {
                type: String,
                required: true
            },
            userId: {
                type: ObjectId,
                required: true
            }
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

const notificationSchema = new mongoose.Schema(
    {
        notificationType: {
            type: String,
            required: true,
            enum: ["postLike", "postComment", "exerciseLike", "exerciseComment", "templateLike", "templateComment", "commentLike", "userFollow", "exerciseFollow", "templateFollow"]
        },
        targetId: {
            type: ObjectId,
            required: true
        },
        createdBy: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: ObjectId,
                required: true
            }
        },
        seen: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
)

const reportSchema = new mongoose.Schema(
    {
        reportType: {
            type: String,
            required: true,
            enum: ["post", "exercise", "template", "comment", "user"]
        },
        targetId: {
            type: ObjectId,
            required: true
        },
        createdBy: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: ObjectId,
                required: true
            }
        },
        reason: {
            type: String,
            required: true
        },
        seen: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const messageSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        createdBy: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: ObjectId,
                required: true
            }
        },
        filePaths: {
            type: [{
                key: {
                    type: String,
                    required: true
                },
                fileType: {
                    type: String,
                    required: true,
                    enum: ["image", "video"]
                }
            }],
            default: []
        },
        seen: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
    {
        members: {
            type: [{
                username: {
                    type: String,
                    required: true
                },
                userId: {
                    type: ObjectId,
                    required: true
                }
            }],
            required: true
        },
        messages: {
            type: [messageSchema],
            required: true
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
            username: {
                type: String,
                required: true
            },
            userId: {
                type: ObjectId,
                required: true
            }
        },
        filePaths: {
            type: [{
                key: {
                    type: String,
                    required: true
                },
                fileType: {
                    type: String,
                    required: true,
                    enum: ["image", "video"]
                }
            }],
            default: []
        },
        share: {
            _id: {
                type: ObjectId,
                required: false
            },
            coll: {
                type: String,
                required: false,
                enum: ["post", "exercise", "template", "workout"]
            }
        },
        likes: {
            type: [likeSchema],
            default: []
        },
        likeCount: {
            type: Number,
            default: 0,
            min: 0
        },
        comments: {
            type: [commentSchema],
            default: []
        },
        commentCount: {
            type: Number,
            default: 0,
            min: 0
        },
        feedReferences: {
            type: [{
                username: {
                    type: String,
                    required: true
                },
                userId: {
                    type: ObjectId,
                    required: true
                }
            }],
            default: []
        }
    },
    { timestamps: true }
);

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            validate: {
                validator(u) {
                    if (u.length < 3) {
                        return false;
                    }

                    if (u.length > 24) {
                        return false;
                    }

                    if (!/^[a-z0-9]+$/i.test(u)) {
                        return false;
                    }

                    if (reservedUsernamesEnum.includes(u)) {
                        return false;
                    }

                    return true;
                }
            }
        },
        searchUsername: {
            type: String,
            default: function() {
                return createEdgeNGrams(this.username, 2)
            }
        },
        email: {
            type: String,
            required: true,
            validate: {
                validator(e) {
                    return emailValidator.validate(e);
                }
            }
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
            type: Date,
            required: true
        },
        height: {
            type: Number,
            default: 0,
            min: 0
        },
        weight: {
            type: Number,
            default: 0,
            min: 0 
        },
        metric: {
            type: Boolean,
            default: true
        },
        country: {
            type: String,
            required: true,
            enum: countryListEnum
        },
        profilePhoto: {
            type: String,
            default: ""
        },
        followerCount: {
            type: Number,
            default: 0,
            min: 0
        },
        followingCount: {
            type: Number,
            default: 0,
            min: 0
        },
        followers: {
            type: [{
                userId: {
                    type: ObjectId,
                    required: true
                },
                username: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            default: []
        },
        following: {
            type: [{
                userId: {
                    type: ObjectId,
                    required: true
                },
                username: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            default: []
        },
        exerciseReferences: {
            type: [{
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
                    required: true
                },
                createdBy: {
                    username: {
                        type: String,
                        required: true
                    },
                    userId: {
                        type: String,
                        required: true
                    }
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            default: []
        },
        templateReferences: {
            type: [{
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
                    required: true
                },
                createdBy: {
                    username: {
                        type: String,
                        required: true
                    },
                    userId: {
                        type: String,
                        required: true
                    }
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }],
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
        notifications: {
            type: [notificationSchema],
            default: []
        },
        conversations: {
            type: [{
                members: {
                    type: [{
                        username: {
                            type: String,
                            required: true
                        },
                        userId: {
                            type: String,
                            required: true
                        }
                    }]
                },
                seenLatest: {
                    type: Boolean,
                    required: true
                },
                _id: {
                    type: ObjectId,
                    required: true
                }
            }],
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
            charts: {
                homepage: {
                    leftRail: {
                        type: [chart],
                        default: []
                    },
                    rightRail: {
                        type: [chart],
                        default: []
                    }
                },
                profile: {
                    leftRail: {
                        type: [chart],
                        default: []
                    },
                    rightRail: {
                        type: [chart],
                        default: []
                    }
                },
                workout: {
                    leftRail: {
                        type: [chart],
                        default: []
                    },
                    rightRail: {
                        type: [chart],
                        default: []
                    }
                }
            }
        },
        public: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const exerciseSchema = new mongoose.Schema(
    {
        createdBy: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: String,
                required: true
            }
        },
        description: {
            type: String,
            required: true
        },
        difficulty: {
            type: Number,
            required: true,
            min: 0,
            max: 5
        },
        measureBy: {
            type: String,
            required: true,
            enum: measureByEnum
        },
        name: {
            type: String,
            required: true
        },
        searchName: {
            type: String,
            default: function() {
                return createEdgeNGrams(this.name, 3)
            }
        },
        filePaths: {
            type: [{
                key: {
                    type: String,
                    required: true
                },
                fileType: {
                    type: String,
                    required: true,
                    enum: ["image", "video"]
                }
            }],
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
            type: [{
                username: {
                    type: String,
                    required: true
                },
                userId: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            default: []
        },
        likeCount: {
            type: Number,
            default: 0,
            min: 0
        },
        commentCount: {
            type: Number,
            default: 0,
            min: 0
        },
        followCount: {
            type: Number,
            default: 0,
            min: 0
        },
        templateReferences: {
            type: [templateReferenceSchema],
            default: []
        },
        public: {
            type: Boolean,
            default: true
        },
        usedAmount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

const templateSchema = new mongoose.Schema(
    {
        createdBy: {
            username: {
                type: String,
                required: true
            },
            userId: {
                type: String,
                required: true
            }
        },
        description: {
            type: String,
            required: true
        },
        difficulty: {
            type: Number,
            required: true,
            min: 0,
            max: 5
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
        searchName: {
            type: String,
            default: function() {
                return createEdgeNGrams(this.name, 3)
            }
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
            default: 0,
            min: 0
        },
        comments: {
            type: [commentSchema],
            default: []
        },
        commentCount: {
            type: Number,
            default: 0,
            min: 0
        },
        follows: {
            type: [{
                username: {
                    type: String,
                    required: true
                },
                userId: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            default: []
        },
        followCount: {
            type: Number,
            default: 0,
            min: 0
        },
        public: {
            type: Boolean,
            default: true
        },
        usedAmount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

module.exports = () => {

    const User = async (uri) => {
        const connection = await mongooseConnect(uri);
        const response =  await connection.model("User", userSchema);   
        return response;
    }

    const Exercise = async (uri) => {
        const connection = await mongooseConnect(uri);
        const response =  await connection.model("Exercise", exerciseSchema);
        return response;
    }

    const Template = async (uri) => {
        const connection = await mongooseConnect(uri);
        const response =  await connection.model("Template", templateSchema);
        return response;
    }

    const Post = async (uri) => {
        const connection = await mongooseConnect(uri);
        const response =  await connection.model("Post", postSchema);
        return response;
    }

    const Report = async (uri) => {
        const connection = await mongooseConnect(uri);
        const response =  await connection.model("Report", reportSchema);
        return response;
    }

    const Conversation = async (uri) => {
        const connection = await mongooseConnect(uri);
        const response = await connection.model("Conversation", conversationSchema)
    }

    return { User, Exercise, Post, Template };
};
