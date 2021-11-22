const ObjectId = require("mongoose").Types.ObjectId

/*
* WORKOUTS
*   Just pull every workout within the dates and we count it server side.
*/
const workouts = (startDate, endDate) => {
    return {
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


/*
* EXERCISES 
*   Filter down workouts to where uniqueExercises includes exerciseId
*   Then map those workouts out to just include createdAt and the relevant recordedExercises
*/
const exercises = (exerciseId, startDate, endDate) => {
    return {
        $map: {
            input: {
                $filter: {
                    input: "$workouts",
                    as: "w",
                    cond: {
                        $and: [
                            { $gte: ["$$w.createdAt", startDate] },
                            { $lte: ["$$w.createdAt", endDate] },
                            { $in: [exerciseId, "$$w.uniqueExercises"] }
                        ]
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

/*
* ORDERED EXERCISES
*   Filter down workouts to just include uniqueExercises
*   Unwind this variable and sum each occurence of uniqueExercise
*   Order them
*/
const orderedExercisesAggregation = (username) => {
    return [
        {
            $match: {
                username: username
            }
        },
        {
            $project: {
                exercises: {
                    $reduce: {
                        input: "$workouts",
                        initialValue: [],
                        in: {
                            $concatArrays: ["$$value", "$$this.uniqueExercises"]
                        }
                    }
                }
            }
        },
        {
            $unwind: "$exercises"
        },
        {
            $group: {
                _id: "$exercises",
                count: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                count: -1
            }
        }
    ]
}

module.exports = { workouts, exercises, orderedExercisesAggregation }