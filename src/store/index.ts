import Vue from 'vue';

import * as activeWorkoutModule from "./activeWorkout";
import * as exercisesModule from "./exercises";
import * as postsModule from "./posts";
import * as templatesModule from "./templates";
import * as apiModule from "./api";

import { Auth, API, withSSRContext } from "aws-amplify";

// Types:
import { getAccessorType, mutationTree, actionTree } from "typed-vuex";
import { IUserProfile, IWorkout, IChart } from "@/types";
import { ActiveWorkoutState } from "./activeWorkout";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { IncomingMessage } from "connect"


export const state = () => {
    return {
        apiName: "projectburnapi",
        workoutPromises: [] as Promise<any>[],
        userProfile: null as IUserProfile | null,
        videoTokens: {} as { [key: string]: any }
    };
}

export type RootState = ReturnType<typeof state>;

export const mutations = mutationTree(state, {
    SET_VIDEO_TOKEN(state, data: { key: string, token: string }): void {
        if (!state.videoTokens[data.key]) {
            Vue.set(state.videoTokens, data.key, { token: data.token, amount: 1 });
        } else {
            state.videoTokens[data.key].token = data.token;
            state.videoTokens[data.key].amount++;
        }
    },

    DELETE_VIDEO_TOKEN(state, key: string): void {
        state.videoTokens[key].amount--;
        if (state.videoTokens[key].amount <= 0) {
            delete state.videoTokens[key];
        }
    },

    SET_LOGGED_IN_USER(state, user: IUserProfile): void {
        state.userProfile = user;
    },

    // setLoggedInUserWorkouts(state, workouts) {
    //     state.userWorkouts = workouts;
    // },

    SET_LOADING_WORKOUTS(state, promises: Promise<any>[]): void {
        state.workoutPromises = promises;
    },

    PUSH_WORKOUT_TO_USER_WORKOUTS(state, workout: IWorkout): void {
        console.log("UNSHIFTING WORKOUTS", workout);
        if (state.userProfile && state.userProfile.docData) {
            state.userProfile.docData.workouts ? state.userProfile.docData.workouts.unshift(workout) : state.userProfile.docData.workouts = [workout];

            let existingWorkoutIndex = -1;

            for (let i = 0; i < state.userProfile.docData.workouts.length; i++) {
                if (workout.name === state.userProfile.docData.workouts[i].name) {
                    existingWorkoutIndex = i;
                    break;
                }
            }

            if (existingWorkoutIndex >= 0) {
                state.userProfile.docData.workouts.splice(existingWorkoutIndex, 1);
            }
        }
    },

    UPDATE_CHART(state, data: { position: string, index: number, options: IChart }): void {
        if (state.userProfile) {
            switch (data.position) {
                case "homepageLeftRail":
                    if (state.userProfile && state.userProfile.docData && state.userProfile.docData.options && state.userProfile.docData.options.charts && state.userProfile.docData.options.charts.homepage && state.userProfile.docData.options.charts.homepage.leftRail) {
                        Vue.set(state.userProfile.docData.options.charts.homepage.leftRail, data.index, data.options);
                    }
                    break;
                case "profileLeftRail":
                    if (state.userProfile && state.userProfile.docData && state.userProfile.docData.options && state.userProfile.docData.options.charts && state.userProfile.docData.options.charts.profile && state.userProfile.docData.options.charts.profile.leftRail) {
                        Vue.set(state.userProfile.docData.options.charts.profile.leftRail, data.index, data.options)
                    }
                    break;
                case "newWorkoutRightRail":
                    if (state.userProfile && state.userProfile.docData && state.userProfile.docData.options && state.userProfile.docData.options.charts && state.userProfile.docData.options.charts.homepage && state.userProfile.docData.options.charts.homepage.leftRail) {
                        // @ts-ignore
                        Vue.set((state.activeWorkout as ActiveWorkoutState).workoutCharts, data.index, data.options);
                    }

                    break;
    
            }            
        }
    }
})

export const actions = actionTree({ state, mutations }, {
    async fetchUser({ state, commit, dispatch }, data: { user: CognitoUserSession, req?: IncomingMessage }): Promise<void> {
        const path = "/user/" + data.user.getIdToken().payload["cognito:username"];
        const myInit = {
            headers: {
                Authorization: await dispatch("fetchJwtToken", { req: data.req })
            }
        };
        
        try {
            const docData = (await API.get(state.apiName, path, myInit)).data;
    
            commit("SET_LOGGED_IN_USER", {
                loggedIn: true,
                data: data.user,
                docData: docData
            });
        }
        catch (err) {
            console.error(err);
            commit("SET_LOGGED_IN_USER", { loggedIn: false, data: null, docData: null });
        }

        return;
    },

    async fetchJwtToken({}, data?: { req?: IncomingMessage }): Promise<string> {
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

    async updateChart({ state, commit, dispatch }, data: { save: boolean, position: string, options: IChart, index: number }) {
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

        commit("UPDATE_CHART", {
            position: data.position,
            options: data.options,
            index: data.index
        });
        return;     
    },

    nuxtServerInit({ commit }) {
        const mutations = ["posts/pushSkeleton", "exercises/pushSkeleton", "templates/pushSkeleton"];

        mutations.forEach(mut => {
            for (let i = 0; i < 5; i++) {
                let amount = Math.floor(Math.random() * 4) + 3;
                let widths = [];
    
                for (let j = 0; j < amount; j++) {
                    widths.push((Math.floor(Math.random() * 50) + 50).toString() + "%");
                }
                
                // @ts-ignore
                commit(mut, [amount, widths])
            }
        })
    }
})

export const accessorType = getAccessorType({
    state,
    mutations,
    actions,
    modules: {
        exercises: exercisesModule,
        activeWorkout: activeWorkoutModule,
        posts: postsModule,
        templates: templatesModule,
        api: apiModule
    }
})