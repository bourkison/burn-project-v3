export const state = () => {
    return {
        templateFeedSkeletons: []
    }
};

export const mutations = {
    pushSkeleton(state, skeleton) {
        state.templateFeedSkeletons.push(skeleton);
    },

    emptySkeletons(state) {
        state.templateFeedSkeletons = [];
    }
}