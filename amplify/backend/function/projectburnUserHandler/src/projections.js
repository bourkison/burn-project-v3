/*
* RECENT WORKOUTS
*   Reverse workouts array. Then check if we have hit the uniqueWorkoutAmount (thus no more needed)
*   Otherwise, check if the name is included yet, if not push it to the output array.
*/
const recentUniqueWorkouts = (uniqueWorkoutAmount) => {
    return {
        $reduce: {
            input: { $reverseArray: "$workouts" },
            initialValue: [],
            in: {
                $cond: [
                    {
                        $and: [
                            {
                                $lt: [{ $size: "$$value" }, uniqueWorkoutAmount]
                            },
                            {
                                $lt: [
                                    {
                                        $indexOfArray: ["$$value.name", "$$this.name"]
                                    },
                                    0
                                ]
                            }
                        ]
                    },
                    {
                        $concatArrays: [
                            "$$value",
                            [
                                {
                                    name: "$$this.name",
                                    _id: "$$this._id",
                                    createdAt: "$$this.createdAt"
                                }
                            ]
                        ]
                    },
                    "$$value"
                ]
            }
        }
    }
};

module.exports = { recentUniqueWorkouts };