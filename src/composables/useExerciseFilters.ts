import { computed, reactive, type ComputedRef, type Ref } from 'vue'
import type { CatalogExercise } from '@/stores/trainingExercises'
import type { Difficulty, Equipment, ExerciseType, Location, MuscleGroup } from '@/data/exercises'

export function useExerciseFilters(exercises: Ref<CatalogExercise[]> | ComputedRef<CatalogExercise[]>) {
  const filters = reactive<{
    muscleGroup: MuscleGroup | ''
    equipment: Equipment | ''
    difficulty: Difficulty | ''
    type: ExerciseType | ''
    location: Location | ''
    search: string
  }>({
    muscleGroup: '',
    equipment: '',
    difficulty: '',
    type: '',
    location: '',
    search: '',
  })

  const filteredExercises = computed(() =>
    exercises.value.filter((e) => {
      if (filters.muscleGroup && e.muscleGroup !== filters.muscleGroup) return false
      if (filters.equipment && e.equipment !== filters.equipment) return false
      if (filters.difficulty && e.difficulty !== filters.difficulty) return false
      if (filters.type && e.type !== filters.type) return false
      if (filters.location && e.location !== filters.location) return false
      if (filters.search && !e.name.toLowerCase().includes(filters.search.trim().toLowerCase())) return false
      return true
    }),
  )

  function resetFilters() {
    filters.muscleGroup = ''
    filters.equipment = ''
    filters.difficulty = ''
    filters.type = ''
    filters.location = ''
    filters.search = ''
  }

  return { filters, filteredExercises, resetFilters }
}
