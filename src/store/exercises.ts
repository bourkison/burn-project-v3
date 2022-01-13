import { getAccessorType,  mutationTree } from "typed-vuex"

export const state = () => {
    return {
        exerciseSkeletons: [] as [number, string[]][]
    }
}

export type ExercisesState = ReturnType<typeof state>

export const mutations = mutationTree(state, {
    PUSH_SKELETON(state, skeleton: [number, string[]]): void {
        state.exerciseSkeletons.push(skeleton)
    },

    EMPTY_SKELETONS(state): void {
        state.exerciseSkeletons = [];
    }
})