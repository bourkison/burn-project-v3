export const state = () => {
    return {
        exerciseSkeletons: []
    }
}

export const mutations = {
    pushSkeleton(state, skeleton) {
        state.exerciseSkeletons.push(skeleton)
    },

    emptySkeletons(state) {
        state.exerciseSkeletons = [];
    }
}