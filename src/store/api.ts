import { API } from "aws-amplify";

import { actionTree } from "typed-vuex";
import { ITemplate, IExercise, IExerciseReference, ITemplateReference } from "@/types";
import {
    QueryTemplateParams,
    QueryTemplateInit,
    GetTemplateParams,
    GetTemplateInit,
    CreateTemplateParams,
    CreateTemplateInit,
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
    EditTemplateParams,
    EditTemplateInit,
    DeleteTemplateParams,
    DeleteTemplateInit
} from "@/types/api";

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
         * EXERCISE API
         *
         */
        async queryExercise({ state }, input: QueryExerciseParams): Promise<IExerciseReference[]> {
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

            let response: IExerciseReference[] = [];
            data.data.forEach((exerciseReference: any) => {
                response.push({
                    exerciseId: exerciseReference.exerciseId,
                    name: exerciseReference.name,
                    muscleGroups: exerciseReference.muscleGroups,
                    tags: exerciseReference.tags,
                    createdBy: {
                        username: exerciseReference.username,
                        userId: exerciseReference.userId
                    },
                    createdAt: exerciseReference.createdAt,
                    isFollow: exerciseReference.isFollow
                })
            });

            return response;

        },

        async getExercise({ state }, input: GetExerciseParams): Promise<IExercise> {
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
            };
        },

        async getExercisePublic({ state }, input: GetExerciseParams): Promise<IExercise> {
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
            };
        },

        async createExercise({ state }, input: CreateExerciseParams ): Promise<string> {
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

        async editExercise({ state }, input: EditExerciseParams ): Promise<string> {
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
         * TEMPLATE API
         *
         */
        async queryTemplate({ state }, input: QueryTemplateParams): Promise<ITemplateReference[]> {
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

            let response: ITemplateReference[] = [];
            data.data.forEach((exerciseReference: any) => {
                response.push({
                    templateId: exerciseReference.templateId,
                    name: exerciseReference.name,
                    muscleGroups: exerciseReference.muscleGroups,
                    tags: exerciseReference.tags,
                    createdBy: {
                        username: exerciseReference.username,
                        userId: exerciseReference.userId
                    },
                    createdAt: exerciseReference.createdAt,
                    isFollow: exerciseReference.isFollow
                })
            });

            return response;

        },

        async getTemplate({ state }, input: GetTemplateParams): Promise<ITemplate> {
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

        async getTemplatePublic({ state }, input: GetTemplateParams): Promise<ITemplate> {
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
        }
    }
);
