import { mutationTree } from "typed-vuex"

export const state = () => {
    return {
        postFeedSkeletons: [] as [number, string[]][]
    }
};

export type PostsState = ReturnType<typeof state>

export const mutations = mutationTree(state, {
    PUSH_SKELETON(state, skeleton: [number, string[]]): void {
        state.postFeedSkeletons.push(skeleton);
    },

    EMPTY_SKELETONS(state): void {
        state.postFeedSkeletons = [];
    }
})