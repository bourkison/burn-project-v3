import { API } from "aws-amplify";

import { actionTree } from "typed-vuex";
import {
    Like,
    QueryLikeParams,
    QueryLikeInit,
    CreateLikeParams,
    CreateLikeInit,
    DeleteLikeParams,
    DeleteLikeInit,
} from "@/types";
import {
    Comment,
    QueryCommentParams,
    QueryCommentInit,
    CreateCommentParams,
    CreateCommentInit,
    DeleteCommentParams,
    DeleteCommentInit
} from "@/types/comment";
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
import {
    QueryWorkoutParams,
    QueryWorkoutInit,
    GetWorkoutParams,
    GetWorkoutInit,
    Workout,
    RecordedExercise,
    RecordedSet,
} from "@/types/workout";
import { UserProfile, UserDocData, GetUserParams, GetUserInit } from "@/types/user";
import { Post, QueryPostParams, QueryPostInit, PostReference, CreatePostParams, CreatePostInit, GetPostParams, GetPostInit } from "@/types/post";
import { Follow, QueryFollowParams, QueryFollowInit, FollowParams, FollowInit } from "@/types/follow";
import { SearchParams, SearchInit, SearchResult } from "@/types/search";

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
                        profilePhoto: data.data.createdBy.profilePhoto,
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
                    profilePhoto: data.data.createdBy.profilePhoto,
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
                    profilePhoto: data.data.createdBy.profilePhoto,
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
                        profilePhoto: data.data.createdBy.profilePhoto,
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
                    profilePhoto: data.data.createdBy.profilePhoto,
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
                createdAt: data.data.createdAt,
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
                    profilePhoto: data.data.createdBy.profilePhoto,
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
                createdAt: data.data.createdAt,
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
         * ----------- WORKOUT API -----------
         *
         */
        async queryWorkout({ state }, input: QueryWorkoutParams): Promise<Workout[]> {
            const path = "/workout";
            let myInit: QueryWorkoutInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.get(state.apiName, path, myInit);
            let response: Workout[] = [];

            data.data.forEach((workout: Workout) => {
                let recordedExercises: RecordedExercise[] = [];
                workout.recordedExercises.forEach((recordedExercise: RecordedExercise) => {
                    let sets: RecordedSet[] = [];

                    recordedExercise.sets.forEach((set) => {
                        sets.push({
                            weightAmount: set.weightAmount,
                            measureAmount: set.measureAmount,
                            measureBy: set.measureBy,
                        });
                    });

                    recordedExercises.push({
                        exerciseReference: recordedExercise.exerciseReference,
                        notes: recordedExercise.notes,
                        sets: sets,
                        options: recordedExercise.options,
                    });
                });

                response.push({
                    _id: workout._id,
                    duration: workout.duration,
                    name: workout.name,
                    notes: workout.notes,
                    uniqueExercises: workout.uniqueExercises,
                    public: workout.public,
                    templateReference: workout.templateReference,
                    recordedExercises: recordedExercises,
                    createdAt: workout.createdAt
                });
            });

            return response;
        },

        async getWorkout({ state }, input: GetWorkoutParams): Promise<Workout> {
            const path = "/workout/" + input.workoutId;
            let myInit: GetWorkoutInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.get(state.apiName, path, myInit);
            let recordedExercises: RecordedExercise[] = [];
            data.data.recordedExercises.forEach((recordedExercise: RecordedExercise) => {
                let sets: RecordedSet[] = [];

                recordedExercise.sets.forEach((set) => {
                    sets.push({
                        weightAmount: set.weightAmount,
                        measureAmount: set.measureAmount,
                        measureBy: set.measureBy,
                    });
                });

                recordedExercises.push({
                    exerciseReference: recordedExercise.exerciseReference,
                    notes: recordedExercise.notes,
                    sets: sets,
                    options: recordedExercise.options,
                });
            });

            return {
                _id: data.data._id,
                duration: data.data.duration,
                name: data.data.name,
                notes: data.data.notes,
                uniqueExercises: data.data.uniqueExercises,
                public: data.data.public,
                templateReference: data.data.templateReference,
                recordedExercises: recordedExercises,
                createdAt: data.data.createdAt
            };
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
                profilePhoto: data.data.profilePhoto,
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
                isLoggedInUser: data.data.isLoggedInUser,
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
                        userId: postReference.createdBy.userId,
                        profilePhoto: data.data.createdBy.profilePhoto,
                    },
                    createdAt: postReference.createdAt,
                });
            });

            return response;
        },

        async getPost({ state }, input: GetPostParams): Promise<Post> {
            let myInit: GetPostInit = input.init
            const path = "/post/" + input.postId;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.get(state.apiName, path, myInit);

            let response: Post = {
                _id: data.data._id,
                content: data.data._content,
                createdBy: {
                    username: data.data.createdBy.username,
                    userId: data.data.createdBy.userId,
                    profilePhoto: data.data.createdBy.profilePhoto
                },
                filePaths: data.data.filePaths,
                likeCount: data.data.likeCount,
                commentCount: data.data.commentCount,
                createdAt: data.data.createdAt,
                isLiked: data.data.isLiked
            }

            if (data.data.share) {
                response.share = {
                    _id: data.data.share._id,
                    coll: data.data.share.coll
                }
            }

            return response;
        },

        async createPost({ state }, input: CreatePostParams): Promise<Post> {
            let myInit: CreatePostInit = input.init;
            const path = "/post";

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.post(state.apiName, path, myInit);

            if (data.data && data.data.postReference) {
                let response: Post = {
                    _id: data.data.postReference._id,
                    content: data.data.postReference._content,
                    createdBy: {
                        username: data.data.postReference.createdBy.username,
                        userId: data.data.postReference.createdBy.userId,
                        profilePhoto: data.data.postReference.createdBy.profilePhoto
                    },
                    filePaths: data.data.postReference.filePaths,
                    likeCount: data.data.postReference.likeCount,
                    commentCount: data.data.postReference.commentCount,
                    createdAt: data.data.postReference.createdAt,
                    isLiked: false
                }
    
                if (data.data.postReference.share) {
                    response.share = {
                        _id: data.data.postReference.share._id,
                        coll: data.data.postReference.share.coll
                    }
                }
    
                return response;
            } else {
                throw new Error("No response from server");
            }

        },

        /*
         *
         * ----------- FOLLOW API -----------
         *
         */
        async queryFollow({ state }, input: QueryFollowParams): Promise<Follow[]> {
            const path = "/follow/" + input.docId;
            let myInit: QueryFollowInit = input.init;
            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.get(state.apiName, path, myInit);
            let response: Follow[] = [];
            data.data.follows.forEach((follow: Follow) => {
                response.push({
                    username: follow.username,
                    userId: follow.userId,
                    profilePhoto: follow.profilePhoto,
                    createdAt: follow.createdAt
                })
            })

            return response;
        },

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
        },

        /*
         *
         * ----------- SEARCH API -----------
         *
         */
        async getSearch({ state }, input: SearchParams): Promise<SearchResult> {
            const path = "/search";
            let myInit: SearchInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.get(state.apiName, path, myInit);

            return {
                user: data.data.user ? data.data.user : undefined,
                exercise: data.data.exercise ? data.data.exercise : undefined,
                template: data.data.template ? data.data.template : undefined,
            };
        },

        /*
         *
         * ----------- COMMENT API -----------
         *
         */
        async queryComment({ state }, input: QueryCommentParams): Promise<Comment[]> {
            const path = "/comment/" + input.docId;
            let myInit: QueryCommentInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.get(state.apiName, path, myInit);
            let response: Comment[] = [];
            data.data.comments.forEach((comment: Comment) => {
                response.push({
                    _id: comment._id,
                    content: comment.content,
                    createdAt: comment.createdAt,
                    createdBy: {
                        username: comment.createdBy.username,
                        userId: comment.createdBy.userId,
                        profilePhoto: comment.createdBy.profilePhoto,
                    },
                    likes: comment.likes,
                    likeCount: comment.likeCount,
                    isLiked: comment.isLiked
                });
            });

            return response;
        },

        async createComment({ state }, input: CreateCommentParams): Promise<Comment> {
            const path = "/comment";
            let myInit: CreateCommentInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.post(state.apiName, path, myInit);
            return {
                _id: data._id,
                createdAt: new Date(),
                likeCount: 0,
                likes: [],
                createdBy: {
                    username: this.app.$accessor.userProfile?.docData?.username || "",
                    userId: this.app.$accessor.userProfile?.docData?._id || "",
                    profilePhoto: this.app.$accessor.userProfile?.docData?.profilePhoto || ""
                },
                content: myInit.body.content,
                isLiked: false
            }
        },

        async deleteComment({ state }, input: DeleteCommentParams): Promise<void> {
            const path = "/comment";
            let myInit: DeleteCommentInit = input.init;

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
         * ----------- LIKE API -----------
         *
         */
        async queryLike({ state }, input: QueryLikeParams): Promise<Like[]> {
            const path = "/like/" + input.docId;
            let myInit: QueryLikeInit = input.init;

            if (!myInit.headers) {
                myInit.headers = {
                    Authorization: await this.app.$accessor.fetchJwtToken(),
                };
            } else if (!myInit.headers.Authorization) {
                myInit.headers.Authorization = await this.app.$accessor.fetchJwtToken();
            }

            const data = await API.get(state.apiName, path, myInit);
            let response: Like[] = [];

            data.data.likes.forEach((like: Like) => {
                response.push({
                    createdBy: {
                        username: like.createdBy.username,
                        userId: like.createdBy.userId,
                        profilePhoto: like.createdBy.profilePhoto
                    }
                })
            })

            return response;
        },

        async createLike({ state }, input: CreateLikeParams): Promise<void> {
            const path = "/like";
            let myInit: CreateLikeInit = input.init;

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

        async deleteLike({ state }, input: DeleteLikeParams): Promise<void> {
            const path = "/like";
            let myInit: DeleteLikeInit = input.init;

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
