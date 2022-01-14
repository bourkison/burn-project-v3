import { API } from "aws-amplify";

import { actionTree } from "typed-vuex";
import {
    QueryTemplateParams,
    QueryTemplateInit,
    GetTemplateParams,
    GetTemplateInit,
    CreateTemplateParams,
    CreateTemplateInit,
    Template,
    TemplateReference,
    EditTemplateParams,
    EditTemplateInit,
    DeleteTemplateParams,
    DeleteTemplateInit,
} from "@/types/template";
import {
    QueryExerciseParams,
    QueryExerciseInit,
    GetExerciseParams,
    GetExerciseInit,
    CreateExerciseParams,
    CreateExerciseInit,
    EditExerciseParams,
    EditExerciseInit,
    DeleteExerciseParams,
    DeleteExerciseInit,
    Exercise,
    ExerciseReference,
} from "@/types/exercise";
import { UserProfile, UserDocData, GetUserParams, GetUserInit } from "@/types/user";
import { QueryPostParams, QueryPostInit, PostReference } from "@/types/post";
import { FollowParams, FollowInit } from "@/types/follow";

export const state = () => {
    return {
        apiName: "projectburnapi",
    };
};

export const actions = actionTree(
    { state },
    {
        /*
         *
         * ----------- EXERCISE API -----------
         *
         */
        async queryExercise({ state }, input: QueryExerciseParams): Promise<ExerciseReference[]> {
            const path = "/exercise";
            let myInit: QueryExerciseInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken({ req: input.req }),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken({
                    req: input.req,
                });
            }

            const data = await API.get(state.apiName, path, myInit);

            if (!data.success) {
                throw new Error("Query exercise unsuccessful: " + data.message);
            }

            let response: ExerciseReference[] = [];
            data.data.forEach((exerciseReference: any) => {
                response.push({
                    exerciseId: exerciseReference.exerciseId,
                    name: exerciseReference.name,
                    muscleGroups: exerciseReference.muscleGroups,
                    tags: exerciseReference.tags,
                    createdBy: {
                        username: exerciseReference.username,
                        userId: exerciseReference.userId,
                    },
                    createdAt: exerciseReference.createdAt,
                    isFollow: exerciseReference.isFollow,
                });
            });

            return response;
        },

        async getExercise({ state }, input: GetExerciseParams): Promise<Exercise> {
            const path = "/exercise/" + input.exerciseId;
            let myInit: GetExerciseInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken({ req: input.req }),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken({
                    req: input.req,
                });
            }

            const data = await API.get(state.apiName, path, myInit);

            if (!data.success) {
                throw new Error("Get exercise unsuccessful: " + data.message);
            }

            return {
                _id: data.data._id,
                createdBy: {
                    username: data.data.createdBy.username,
                    userId: data.data.createdBy.userId,
                },
                description: data.data.description,
                difficulty: data.data.difficulty,
                measureBy: data.data.measureBy,
                name: data.data.name,
                filePaths: data.data.filePaths,
                muscleGroups: data.data.muscleGroups,
                tags: data.data.tags,
                likeCount: data.data.likeCount,
                commentCount: data.data.commentCount,
                followCount: data.data.followCount,
                usedAmount: data.data.usedAmount,
                public: data.data.public,
                isLiked: data.data.isLiked,
                isFollowed: data.data.isFollowed,
                isFollowable: data.data.isFollowable,
                createdAt: data.data.createdAt,
            };
        },

        async getExercisePublic({ state }, input: GetExerciseParams): Promise<Exercise> {
            const path = "/public/exercise/" + input.exerciseId;
            const data = await API.get(state.apiName, path, input.init);

            if (!data.success) {
                throw new Error("Get exercise unsuccessful: " + data.message);
            }

            return {
                _id: data.data._id,
                createdBy: {
                    username: data.data.createdBy.username,
                    userId: data.data.createdBy.userId,
                },
                description: data.data.description,
                difficulty: data.data.difficulty,
                measureBy: data.data.measureBy,
                name: data.data.name,
                filePaths: data.data.filePaths,
                muscleGroups: data.data.muscleGroups,
                tags: data.data.tags,
                likeCount: data.data.likeCount,
                commentCount: data.data.commentCount,
                followCount: data.data.followCount,
                usedAmount: data.data.usedAmount,
                public: data.data.public,
                isLiked: data.data.isLiked,
                isFollowed: data.data.isFollowed,
                isFollowable: data.data.isFollowable,
                createdAt: data.data.createdAt,
            };
        },

        async createExercise({ state }, input: CreateExerciseParams): Promise<string> {
            const path = "/exercise";
            let myInit: CreateExerciseInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const response = await API.post(state.apiName, path, myInit);
            return response.data._id;
        },

        async editExercise({ state }, input: EditExerciseParams): Promise<string> {
            const path = "/exercise/" + input.exerciseId;
            let myInit: EditExerciseInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const response = await API.put(state.apiName, path, myInit);
            return response.data._id;
        },

        async deleteExercise({ state }, input: DeleteExerciseParams): Promise<void> {
            const path = "/exercise/" + input.exerciseId;
            let myInit: DeleteExerciseInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            await API.del(state.apiName, path, myInit);
            return;
        },

        /*
         *
         * ----------- TEMPLATE API -----------
         *
         */
        async queryTemplate({ state }, input: QueryTemplateParams): Promise<TemplateReference[]> {
            const path = "/template";
            let myInit: QueryTemplateInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken({ req: input.req }),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken({
                    req: input.req,
                });
            }

            const data = await API.get(state.apiName, path, myInit);

            if (!data.success) {
                throw new Error("Query template unsuccessful: " + data.message);
            }

            let response: TemplateReference[] = [];
            data.data.forEach((exerciseReference: any) => {
                response.push({
                    templateId: exerciseReference.templateId,
                    name: exerciseReference.name,
                    muscleGroups: exerciseReference.muscleGroups,
                    tags: exerciseReference.tags,
                    createdBy: {
                        username: exerciseReference.username,
                        userId: exerciseReference.userId,
                    },
                    createdAt: exerciseReference.createdAt,
                    isFollow: exerciseReference.isFollow,
                });
            });

            return response;
        },

        async getTemplate({ state }, input: GetTemplateParams): Promise<Template> {
            const path = "/template/" + input.templateId;
            let myInit: GetTemplateInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken({ req: input.req }),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken({
                    req: input.req,
                });
            }

            const data = await API.get(state.apiName, path, myInit);

            if (!data.success) {
                throw new Error("Unsuccessful: " + data.message);
            }

            return {
                _id: data.data._id,
                createdBy: {
                    username: data.data.createdBy.username,
                    userId: data.data.createdBy.userId,
                },
                description: data.data.description,
                difficulty: data.data.difficulty,
                exerciseReferences: data.data.exerciseReferences,
                muscleGroups: data.data.muscleGroups,
                name: data.data.name,
                tags: data.data.tags,
                likeCount: data.data.likeCount,
                commentCount: data.data.commentCount,
                followCount: data.data.followCount,
                usedAmount: data.data.usedAmount,
                public: data.data.public,
                isLiked: data.data.isLiked,
                isFollowed: data.data.isFollowed,
                isFollowable: data.data.isFollowable,
            };
        },

        async getTemplatePublic({ state }, input: GetTemplateParams): Promise<Template> {
            const path = "/public/template";
            const data = await API.get(state.apiName, path, input.init);

            if (!data.success) {
                throw new Error("Unsuccessful: " + data.message);
            }

            return {
                _id: data.data._id,
                createdBy: {
                    username: data.data.createdBy.username,
                    userId: data.data.createdBy.userId,
                },
                description: data.data.description,
                difficulty: data.data.difficulty,
                exerciseReferences: data.data.exerciseReferences,
                muscleGroups: data.data.muscleGroups,
                name: data.data.name,
                tags: data.data.tags,
                likeCount: data.data.likeCount,
                commentCount: data.data.commentCount,
                followCount: data.data.followCount,
                usedAmount: data.data.usedAmount,
                public: data.data.public,
                isLiked: data.data.isLiked,
                isFollowed: data.data.isFollowed,
                isFollowable: data.data.isFollowable,
            };
        },

        async createTemplate({ state }, input: CreateTemplateParams): Promise<string> {
            const path = "/template";
            let myInit: CreateTemplateInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const response = await API.post(state.apiName, path, myInit);

            return response.data._id;
        },

        async editTemplate({ state }, input: EditTemplateParams): Promise<string> {
            const path = "/template/" + input.templateId;
            let myInit: EditTemplateInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const response = await API.put(state.apiName, path, myInit);
            return response.data._id;
        },

        async deleteTemplate({ state }, input: DeleteTemplateParams): Promise<void> {
            const path = "/template/" + input.templateId;
            let myInit: DeleteTemplateInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            await API.del(state.apiName, path, myInit);
            return;
        },

        /*
         *
         * ----------- USER API -----------
         *
         */
        /** @summary Gets all document data from current logged in profile */
        async getUser({ state }, input: GetUserParams): Promise<UserDocData> {
            const path = "/user/" + input.userId;
            let myInit: GetUserInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            if (myInit.queryStringParameters?.view === "profile") {
                throw new Error("Profile query passed through.");
            }

            const data = await API.get(state.apiName, path, myInit);

            return {
                _id: data.data._id,
                username: data.data.username,
                country: data.data.country,
                dob: data.data.dob,
                email: data.data.email,
                firstName: data.data.firstName,
                surname: data.data.surname,
                gender: data.data.gender,
                height: data.data.height,
                metric: data.data.metric,
                options: data.data.options,
                weight: data.data.weight,
                workouts: data.data.workouts,
            };
        },

        /** @summary Gets public document data from a user. Must pass through view === "profile" into queryStringParameters */
        async getUserProfile({ state }, input: GetUserParams): Promise<UserProfile> {
            const path = "/user/" + input.userId;
            let myInit: GetUserInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            if (myInit.queryStringParameters?.view !== "profile") {
                throw new Error("No profile query passed through.");
            }

            const data = await API.get(state.apiName, path, myInit);

            return {
                _id: data.data._id,
                username: data.data.username,
                options: data.data.options,
                followerCount: data.data.followerCount,
                followingCount: data.data.followingCount,
                followers: data.data.followers,
                isFollowed: data.data.isFollowed,
                isLoggedInUser: data.data.isLoggedInUser
            };
        },

        /*
         *
         * ----------- POST API -----------
         *
         */
        async queryPost({ state }, input: QueryPostParams): Promise<PostReference[]> {
            let myInit: QueryPostInit = input.init;
            const path = "/post";

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.get(state.apiName, path, myInit);
            let response: PostReference[] = [];
            data.data.forEach((postReference: any) => {
                response.push({
                    _id: postReference._id,
                    createdBy: {
                        username: postReference.createdBy.username,
                        userId: postReference.createdBy.userId
                    },
                    createdAt: postReference.createdAt
                })
            })

            return response
        },

        /*
         *
         * ----------- FOLLOW API -----------
         *
         */
        async createFollow({ state }, input: FollowParams): Promise<void> {
            const path = "/follow";
            let myInit: FollowInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            await API.post(state.apiName, path, myInit);
            return;
        },

        async deleteFollow({ state }, input: FollowParams): Promise<void> {
            const path = "/follow";
            let myInit: FollowInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            await API.del(state.apiName, path, myInit);
            return;
        }
    }
);
