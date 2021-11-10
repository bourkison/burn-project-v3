<template>
    <b-container>
        <b-row>
            <b-col cols="2"> </b-col>
            <b-col cols="8">
                <b-card no-body class="mainCard">
                    <b-card-body>
                        <b-card-title>Populate Database</b-card-title>

                        <div>
                            <b-form @submit.prevent="populateDatabase">
                                <!-- USERS -->
                                <h5 class="mt-4">Users</h5>
                                <b-form-group
                                    label="Users"
                                    label-for="userAmountInput"
                                    :description="userAmount + ' selected'"
                                >
                                    <b-form-input
                                        id="userAmountInput"
                                        v-model="userAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="100"
                                    />
                                </b-form-group>

                                <!-- POSTS -->
                                <h5 class="mt-4">Posts</h5>
                                <b-form-group
                                    label="Posts Created per User"
                                    label-for="postAmountInput"
                                    :description="
                                        postAmount +
                                            ' selected. ' +
                                            postAmount * userAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="postAmountInput"
                                        v-model="postAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="20"
                                    />
                                </b-form-group>

                                <!-- EXERCISES -->
                                <h5 class="mt-4">Exercises</h5>
                                <b-form-group
                                    label="Exercises Created per User"
                                    label-for="exerciseAmountInput"
                                    :description="
                                        exerciseAmount +
                                            ' selected. ' +
                                            exerciseAmount * userAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="exerciseAmountInput"
                                        v-model="exerciseAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="20"
                                    />
                                </b-form-group>

                                <b-form-group
                                    label="Exercises Followed per User"
                                    label-for="exerciseFollowAmountInput"
                                    :description="
                                        exerciseFollowAmount +
                                            ' selected. ' +
                                            exerciseFollowAmount * userAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="exerciseFollowAmountInput"
                                        v-model="exerciseFollowAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="exerciseAmount * (userAmount - 1)"
                                    />
                                </b-form-group>

                                <!-- TEMPLATES -->
                                <h5 class="mt-4">Templates</h5>
                                <b-form-group
                                    label="Templates Created per User"
                                    label-for="templateAmountInput"
                                    :description="
                                        templateAmount +
                                            ' selected. ' +
                                            templateAmount * userAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="templateAmountInput"
                                        v-model="templateAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="20"
                                    />
                                </b-form-group>

                                <b-form-group
                                    label="Templates Followed per User"
                                    label-for="templateFollowAmountInput"
                                    :description="
                                        templateFollowAmount +
                                            ' selected. ' +
                                            templateFollowAmount * userAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="templateFollowAmountInput"
                                        v-model="templateFollowAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="templateAmount * (userAmount - 1)"
                                    />
                                </b-form-group>

                                <!-- WORKOUTS -->
                                <h5 class="mt-4">Workouts</h5>
                                <b-form-group
                                    label="Workouts per User"
                                    label-for="workoutAmountInput"
                                    :description="
                                        workoutAmount +
                                            ' selected. ' +
                                            workoutAmount * userAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="workoutAmountInput"
                                        v-model="workoutAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="100"
                                    />
                                </b-form-group>

                                <b-form-group
                                    label="Exercises per Workout"
                                    label-for="exercisePerWorkoutAmountInput"
                                    :description="exercisePerWorkoutAmount + ' selected.'"
                                >
                                    <b-form-input
                                        id="exercisePerWorkoutAmountInput"
                                        v-model="exercisePerWorkoutAmount"
                                        type="range"
                                        required
                                        :min="1"
                                        :max="12"
                                    />
                                </b-form-group>

                                <b-form-group
                                    label="Sets per Exercise"
                                    label-for="setsAmountInput"
                                    :description="setAmount + ' selected.'"
                                >
                                    <b-form-input
                                        id="setsAmountInput"
                                        v-model="setAmount"
                                        type="range"
                                        required
                                        :min="1"
                                        :max="12"
                                    />
                                </b-form-group>

                                <!-- LIKES -->
                                <h5 class="mt-4">Likes</h5>
                                <b-form-group
                                    label="Likes per Post"
                                    label-for="likePerPostAmountInput"
                                    :description="
                                        likePerPostAmount +
                                            ' selected. ' +
                                            likePerPostAmount * postAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="likePerPostAmountInput"
                                        v-model="likePerPostAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="userAmount"
                                    />
                                </b-form-group>

                                <b-form-group
                                    label="Likes per Exercise"
                                    label-for="likePerExerciseAmountInput"
                                    :description="
                                        likePerExerciseAmount +
                                            ' selected. ' +
                                            likePerExerciseAmount * exerciseAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="likePerExerciseAmountInput"
                                        v-model="likePerExerciseAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="userAmount"
                                    />
                                </b-form-group>

                                <b-form-group
                                    label="Likes per Template"
                                    label-for="likePerTemplateAmountInput"
                                    :description="
                                        likePerTemplateAmount +
                                            ' selected. ' +
                                            likePerTemplateAmount * templateAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="likePerTemplateAmountInput"
                                        v-model="likePerTemplateAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="userAmount"
                                    />
                                </b-form-group>

                                <!-- COMMENTS -->
                                <h5 class="mt-4">Comments</h5>
                                <b-form-group
                                    label="Comments per Post"
                                    label-for="commentsPerPostAmountInput"
                                    :description="
                                        commentPerExerciseAmount +
                                            ' selected. ' +
                                            commentPerExerciseAmount * postAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="commentPerPostAmount"
                                        v-model="commentPerPostAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="userAmount * postAmount * 3"
                                    />
                                </b-form-group>

                                <b-form-group
                                    label="Comments per Exercise"
                                    label-for="commentsPerExerciseAmountInput"
                                    :description="
                                        commentPerExerciseAmount +
                                            ' selected. ' +
                                            commentPerExerciseAmount * exerciseAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="commentPerExerciseAmount"
                                        v-model="commentPerExerciseAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="userAmount * exerciseAmount * 3"
                                    />
                                </b-form-group>

                                <b-form-group
                                    label="Comments per Template"
                                    label-for="commentsPerTemplateAmountInput"
                                    :description="
                                        commentPerTemplateAmount +
                                            ' selected. ' +
                                            commentPerTemplateAmount * templateAmount +
                                            ' total.'
                                    "
                                >
                                    <b-form-input
                                        id="commentPerTemplateAmount"
                                        v-model="commentPerTemplateAmount"
                                        type="range"
                                        required
                                        :min="0"
                                        :max="userAmount * templateAmount * 3"
                                    />
                                </b-form-group>

                                <div class="mt-5 text-center">
                                    <b-button variant="primary" type="submit" :disabled="isLoading">
                                        <span v-if="!isLoading">Populate</span>
                                        <span v-else><b-spinner small/></span>
                                    </b-button>
                                </div>
                            </b-form>
                        </div>
                    </b-card-body>
                </b-card>
            </b-col>
            <b-col cols="2"> </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { API, Auth } from "aws-amplify";
import faker from "faker";
import dayjs from "dayjs";

export default {
    name: "Admin",
    data() {
        return {
            isLoading: false,

            userAmount: 0,

            postAmount: 0,

            exerciseAmount: 0,
            exerciseFollowAmount: 0,

            templateAmount: 0,
            templateFollowAmount: 0,

            workoutAmount: 0,
            exercisePerWorkoutAmount: 1,
            setAmount: 1,

            likePerExerciseAmount: 0,
            likePerTemplateAmount: 0,
            likePerPostAmount: 0,

            commentPerPostAmount: 0,
            commentPerExerciseAmount: 0,
            commentPerTemplateAmount: 0
        };
    },

    created: function() {
        for (let i = 0; i < 5; i++) {
            console.log(faker.lorem.words(Math.floor(Math.random() * 4 + 1)));
        }
    },

    methods: {
        populateDatabase: async function() {
            this.isLoading = true;

            // First create users.
            let createUserPromises = [];
            let usernames = [];

            for (let i = 0; i < this.userAmount; i++) {
                const username = faker.internet.userName();

                createUserPromises.push(
                    Auth.signUp({
                        username: username,
                        password: "Harrison1",
                        attributes: {
                            email: faker.internet.exampleEmail(),
                            birthdate: dayjs(
                                faker.date.between(new Date("1960-01-01"), new Date("2000-01-01"))
                            ).format("YYYY-MM-DD"),
                            gender: Math.floor(Math.random() * 2) ? "male" : "female",
                            given_name: faker.name.firstName(),
                            family_name: faker.name.lastName(),
                            locale: faker.address.country()
                        }
                    })
                );

                usernames.push(username);
            }

            await Promise.all(createUserPromises);

            const path = "/admin";
            const myInit = {
                headers: {
                    Authorization: this.$store.state.userProfile.data.idToken.jwtToken
                },
                body: {
                    databaseForm: {
                        userAmount: Number(this.userAmount),
                        usernames: usernames,
                        postAmount: Number(this.postAmount),
                        exerciseAmount: Number(this.exerciseAmount),
                        exerciseFollowAmount: Number(this.exerciseFollowAmount),
                        templateAmount: Number(this.templateAmount),
                        templateFollowAmount: Number(this.templateFollowAmount),
                        workoutAmount: Number(this.workoutAmount),
                        exercisePerWorkoutAmount: Number(this.exercisePerWorkoutAmount),
                        setAmount: Number(this.setAmount),
                        likePerExerciseAmount: Number(this.likePerExerciseAmount),
                        likePerTemplateAmount: Number(this.likePerTemplateAmount),
                        likePerPostAmount: Number(this.likePerPostAmount),
                        commentPerPostAmount: Number(this.commentPerPostAmount),
                        commentPerExerciseAmount: Number(this.commentPerExerciseAmount),
                        commentPerTemplateAmount: Number(this.commentPerTemplateAmount)
                    }
                }
            };

            const result = await API.post(this.$store.state.apiName, path, myInit);
            console.log(result);
            this.isLoading = false;
        }
    }
};
</script>

<style scoped>
.mainCard {
    margin-top: 40px;
}
</style>
