const ObjectId = require("mongoose").Types.ObjectId;

/*
 * REDUCED EXERCISE BY MG/TAG
 *   Pulls all exercises where inputMuscleGroups set is a subset of exercise muscle groups
 */
const reducedExerciseByMg = () => {
    return {
        $reduce: {
            input: "$exerciseReferences",
            initialValue: [],
            in: {
                $cond: [
                    {
                        $setIsSubset: ["$inputMuscleGroups", "$$this.muscleGroups"]
                    },
                    {
                        $concatArrays: ["$$value", ["$$this"]]
                    },
                    "$$value"
                ]
            }
        }
    };
};
const reducedExerciseByTag = () => {
    return {
        $reduce: {
            input: "$exerciseReferences",
            initialValue: [],
            in: {
                $cond: [
                    {
                        $setIsSubset: ["$inputTags", "$$this.tags"]
                    },
                    {
                        $concatArrays: ["$$value", ["$$this"]]
                    },
                    "$$value"
                ]
            }
        }
    };
};

/*
 * PAGINATION COMMENCE
 *   Finds the index of the provided startAt ID within user exercise references
 */
const paginationCommence = startAt => {
    return {
        $project: {
            exerciseReferences: 1,
            startAtIndex: {
                $indexOfArray: ["$exerciseReferences.exerciseId", ObjectId(startAt)]
            }
        }
    };
};

/*
 * PAGINATION CHECK INDICES
 *   Ensures loadAmount is not greater than startAtIndex causing startAtIndex - loadAmount to go negative.
 */
const paginationCheckIndices = loadAmount => {
    return {
        $project: {
            exerciseReferences: 1,
            actualLoadAmount: {
                $cond: [{ $lt: ["$startAtIndex", loadAmount] }, "$startAtIndex", loadAmount]
            },
            startAtIndex: {
                $cond: [
                    {
                        $lte: [{ $subtract: ["$startAtIndex", loadAmount] }, 0]
                    },
                    0,
                    { $subtract: ["$startAtIndex", loadAmount] }
                ]
            }
        }
    };
};

/*
 * PAGINATION FINAL
 *   Slice exerciseReferences.
 */
const paginationFinal = () => {
    return {
        $project: {
            startAtIndex: 1,
            actualLoadAmount: 1,
            exerciseReferences: {
                $cond: [
                    { $eq: ["$actualLoadAmount", 0] },
                    [],
                    { $slice: ["$exerciseReferences", "$startAtIndex", "$actualLoadAmount"] }
                ]
            }
        }
    };
};

module.exports = {
    reducedExerciseByMg,
    reducedExerciseByTag,
    paginationCommence,
    paginationCheckIndices,
    paginationFinal
};
