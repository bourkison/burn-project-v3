export { default as ExerciseComponent } from '../../components/Exercise/ExerciseComponent.vue'
export { default as ExerciseExpandable } from '../../components/Exercise/ExerciseExpandable.vue'
export { default as ExerciseFeed } from '../../components/Exercise/ExerciseFeed.vue'
export { default as ExerciseRecorder } from '../../components/Exercise/ExerciseRecorder.vue'
export { default as ExerciseSearch } from '../../components/Exercise/ExerciseSearch.vue'
export { default as ExerciseShare } from '../../components/Exercise/ExerciseShare.vue'
export { default as PostComponent } from '../../components/Post/PostComponent.vue'
export { default as PostFeed } from '../../components/Post/PostFeed.vue'
export { default as PostFeedHome } from '../../components/Post/PostFeedHome.vue'
export { default as PostNew } from '../../components/Post/PostNew.vue'
export { default as SearchMainSearch } from '../../components/Search/MainSearch.vue'
export { default as TemplateBuilder } from '../../components/Template/TemplateBuilder.vue'
export { default as TemplateComponent } from '../../components/Template/TemplateComponent.vue'
export { default as TemplateFeed } from '../../components/Template/TemplateFeed.vue'
export { default as TemplateSearch } from '../../components/Template/TemplateSearch.vue'
export { default as TemplateShare } from '../../components/Template/TemplateShare.vue'
export { default as UserList } from '../../components/User/UserList.vue'
export { default as Comment } from '../../components/Comment/Comment.vue'
export { default as CommentNew } from '../../components/Comment/CommentNew.vue'
export { default as CommentSection } from '../../components/Comment/CommentSection.vue'
export { default as ChartsChart } from '../../components/Charts/Chart.vue'
export { default as ChartsRecentWorkoutsChart } from '../../components/Charts/RecentWorkoutsChart.vue'
export { default as AuthSignInForm } from '../../components/Auth/SignInForm.vue'
export { default as AuthSignUpForm } from '../../components/Auth/SignUpForm.vue'
export { default as VideoPlayer } from '../../components/Video/VideoPlayer.vue'
export { default as WorkoutComponent } from '../../components/Workout/WorkoutComponent.vue'
export { default as WorkoutSearch } from '../../components/Workout/WorkoutSearch.vue'
export { default as WorkoutShare } from '../../components/Workout/WorkoutShare.vue'
export { default as WorkoutToast } from '../../components/Workout/WorkoutToast.vue'
export { default as UtilityAvatarEditor } from '../../components/Utility/AvatarEditor.vue'
export { default as UtilityDifficultySelector } from '../../components/Utility/DifficultySelector.vue'
export { default as UtilityImageEditor } from '../../components/Utility/ImageEditor.vue'
export { default as UtilityImageSorter } from '../../components/Utility/ImageSorter.vue'
export { default as UtilityImageUploader } from '../../components/Utility/ImageUploader.vue'
export { default as UtilityLoadingComponent } from '../../components/Utility/LoadingComponent.vue'
export { default as UtilityMuscleGroup } from '../../components/Utility/MuscleGroup.vue'
export { default as UtilityMuscleGroupSelector } from '../../components/Utility/MuscleGroupSelector.vue'
export { default as UtilityQuickStart } from '../../components/Utility/QuickStart.vue'
export { default as UtilityTagSelector } from '../../components/Utility/TagSelector.vue'
export { default as UtilityUsernameFilter } from '../../components/Utility/UsernameFilter.vue'

// nuxt/nuxt.js#8607
function wrapFunctional(options) {
  if (!options || !options.functional) {
    return options
  }

  const propKeys = Array.isArray(options.props) ? options.props : Object.keys(options.props || {})

  return {
    render(h) {
      const attrs = {}
      const props = {}

      for (const key in this.$attrs) {
        if (propKeys.includes(key)) {
          props[key] = this.$attrs[key]
        } else {
          attrs[key] = this.$attrs[key]
        }
      }

      return h(options, {
        on: this.$listeners,
        attrs,
        props,
        scopedSlots: this.$scopedSlots,
      }, this.$slots.default)
    }
  }
}
