import { mutationTree } from "typed-vuex";

export const state = () => {
    return {
        templateFeedSkeletons: [] as [number, string[]][]
    }
};

export const mutations = mutationTree(state, {
    PUSH_SKELETON(state, skeleton: [number, string[]]): void {
        state.templateFeedSkeletons.push(skeleton);
    },

    EMPTY_SKELETONS(state): void {
        state.templateFeedSkeletons = [];
    }
})