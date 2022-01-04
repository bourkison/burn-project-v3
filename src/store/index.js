import { Auth, API } from "aws-amplify";
import Vue from 'vue';

export const state = () => {
    return {
        apiName: "projectburnapi",
        workoutPromises: [],
        userProfile: null,
        videoTokens: {}
    };
}

export const mutations = {
    setVideoToken: function(state, data) {
        if (!state.videoTokens[data.key]) {
            Vue.set(state.videoTokens, data.key, { token: data.token, amount: 1 });
        } else {
            state.videoTokens[data.key].token = data.token;
            state.videoTokens[data.key].amount++;
        }
    },

    deleteVideoToken: function(state, key) {
        state.videoTokens[key].amount--;
        if (state.videoTokens[key].amount <= 0) {
            delete state.videoTokens[key];
        }
    },

    setLoggedInUser: function(state, user) {
        state.userProfile = user;
    },

    setLoggedInUserWorkouts: function(state, workouts) {
        state.userWorkouts = workouts;
    },

    setLoadingWorkouts: function(state, promises) {
        state.workoutPromises = promises;
    },

    pushWorkoutToUserWorkouts: function(state, workout) {
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

    updateChart: function(state, data) {
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
    fetchUser: async function({ state, commit, dispatch }, data) {
        console.log("Fetching User:", data);
        const path = "/user/" + data.idToken.payload["cognito:username"];
        let myInit;
        if (!data.ssr) {
            myInit = {
                headers: {
                    Authorization: await dispatch("fetchJwtToken")
                }
            };
        } else {
            myInit = {
                headers: {
                    Authorization: data.idToken.payload.jwtToken
                }
            };
        }
        
        try {
            const docData = (await API.get(state.apiName, path, myInit)).data;
    
            commit("setLoggedInUser", {
                loggedIn: true,
                data: data,
                docData: docData
            });
        }
        catch (err) {
            console.error("USER DOC ERR:", err);
            commit("setLoggedInUser", { loggedIn: false, data: null, docData: null });
        }

        return;
    },

    fetchJwtToken: async function({ state, commit }) {
        try {
            return (await Auth.currentSession()).getIdToken().getJwtToken();
        }
        catch (err) {
            return "";
        }
    },

    updateChart: async function({ state, commit, dispatch }, data) {
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

    nuxtServerInit: async function({ commit, dispatch }, { req }) {
        // console.log("Nuxt server init", req.headers.cookie);
        // console.log("User:", await Auth.currentSession());
        if (req.headers.cookie) {
            let cookieArr = req.headers.cookie.split(";");
            let jwtToken;
            let username;

            for (let i = 0; i < cookieArr.length; i ++) {
                let cookieKey = cookieArr[i].split("=")[0].trim();
                console.log("Searching cookie:", cookieKey);

                if (cookieKey.split(".").length > 0 && cookieKey.split(".")[0] === "CognitoIdentityServiceProvider" && cookieKey.split(".")[cookieKey.split(".").length - 1] === "LastAuthUser") {
                    console.log("Cookie found:", cookieArr[i].split("=")[1]);
                    username = cookieArr[i].split("=")[1];
                } else if (cookieKey.split(".").length > 0 && cookieKey.split(".")[0] === "CognitoIdentityServiceProvider" && cookieKey.split(".")[cookieKey.split(".").length - 1] === "idToken") {
                    jwtToken = cookieArr[i].split("=")[1];
                }

                if (username && jwtToken) { 
                    await dispatch("fetchUser", 
                    {
                        idToken: {
                            payload: {
                                "cognito:username": username,
                                jwtToken: jwtToken
                            }
                        },
                        ssr: true
                    });

                    break; 
                }
            }
        }

        return;
    }
}
