export const state = () => {
    return {
        postFeedSkeletons: []
    }
};

export const mutations = {
    pushSkeleton(state, skeleton) {
        state.postFeedSkeletons.push(skeleton);
    },

    emptySkeletons(state) {
        state.postFeedSkeletons = [];
    }
}