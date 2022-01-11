import { Auth, API, withSSRContext } from "aws-amplify";
import Vue from 'vue';

export const state = () => {
    return {
        apiName: "projectburnapi",
        workoutPromises: [],
        userProfile: null,
        videoTokens: {},
        postFeedSkeleton: []
    };
}

export const mutations = {
    setVideoToken(state, data) {
        if (!state.videoTokens[data.key]) {
            Vue.set(state.videoTokens, data.key, { token: data.token, amount: 1 });
        } else {
            state.videoTokens[data.key].token = data.token;
            state.videoTokens[data.key].amount++;
        }
    },

    deleteVideoToken(state, key) {
        state.videoTokens[key].amount--;
        if (state.videoTokens[key].amount <= 0) {
            delete state.videoTokens[key];
        }
    },

    setLoggedInUser(state, user) {
        state.userProfile = user;
    },

    setLoggedInUserWorkouts(state, workouts) {
        state.userWorkouts = workouts;
    },

    setLoadingWorkouts(state, promises) {
        state.workoutPromises = promises;
    },

    pushWorkoutToUserWorkouts(state, workout) {
        console.log("UNSHIFTING WORKOUTS", workout);
        state.userProfile.docData.workouts ? state.userProfile.docData.workouts.unshift(workout) : state.userProfile.docData.workouts = [workout];

        let existingWorkoutIndex = -1;

        for (let i = 0; i < state.userProfile.docData.workouts.length; i++) {
            if (workout.name === state.userProfile.docData.workouts.name) {
                existingWorkoutIndex = i;
                break;
            }
        }

        if (existingWorkoutIndex >= 0) {
            state.userProfile.docData.workouts.splice(existingWorkoutIndex, 1);
        }
    },

    updateChart(state, data) {
        switch (data.position) {
            case "homepageLeftRail":
                Vue.set(state.userProfile.docData.options.charts.homepage.leftRail, data.index, data.options);
                break;
            case "profileLeftRail":
                Vue.set(state.userProfile.docData.options.charts.profile.leftRail, data.index, data.options)
                break;
            case "newWorkoutRightRail":
                Vue.set(state.activeWorkout.workoutCharts, data.index, data.options);
                break;

        }            
    }
}

export const actions = {
    async fetchUser({ state, commit, dispatch }, data) {
        const path = "/user/" + data.user.idToken.payload["cognito:username"];
        const myInit = {
            headers: {
                Authorization: await dispatch("fetchJwtToken", { req: data.req })
            }
        };
        
        try {
            const docData = (await API.get(state.apiName, path, myInit)).data;
    
            commit("setLoggedInUser", {
                loggedIn: true,
                data: data.user,
                docData: docData
            });
        }
        catch (err) {
            console.error("USER DOC ERR:", err);
            commit("setLoggedInUser", { loggedIn: false, data: null, docData: null });
        }

        return;
    },

    async fetchJwtToken({}, data) {
        try {
            if (process.server && data && data.req) {
                const SSR = withSSRContext({ req: data.req });
                return (await SSR.Auth.currentSession()).getIdToken().getJwtToken();
            } else if (process.server) {
                throw new Error("No req context passed through in server side call");
            } else {
                return (await Auth.currentSession()).getIdToken().getJwtToken();
            }
        }
        catch (err) {
            console.error("Error getting jwtToken", err, data);
            return "";
        }
    },

    async updateChart({ state, commit, dispatch }, data) {
        if (data.save) {
            const path = "/stats/" + data.position;
            const myInit = {
                headers: {
                    Authorization: await dispatch("fetchJwtToken")
                },
                body: {
                    options: data.options,
                    index: data.index
                }
            }

            const response = await API.put(state.apiName, path, myInit);
            console.log(response);
        }

        commit("updateChart", data);
        return;     
    },

    nuxtServerInit({ state }) {
        for (let i = 0; i < 5; i++) {
            let amount = Math.floor(Math.random() * 4) + 3;
            let widths = [];

            for (let j = 0; j < amount; j++) {
                widths.push((Math.floor(Math.random() * 50) + 50).toString() + "%");
            }

            state.postFeedSkeleton.push([amount, widths]);
        }
    }
}
