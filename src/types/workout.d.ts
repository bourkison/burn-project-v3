import { Chart, TMeasureBy } from "@/types";
import { TemplateReference } from "@/types/template";
import { ExerciseReference } from "@/types/exercise";

// Workout
export type Workout = {
    duration: number;
    name: string;
    notes: string;
    recordedExercises: RecordedExercise[]
    uniqueExercises: string[];
    options?: {
        charts?: Chart[]
    }[]
    templateReference: TemplateReference;
    public: boolean;
}

export type RecordedExercise = {
    exerciseReference: ExerciseReference;
    notes: string;
    options: {
        measureBy: TMeasureBy;
        weightUnit: "kg"|"lb"
    }
    sets: RecordedSet[]
}

export type RecordedSet = {
    weightAmount: number;
    measureAmount: number;
    measureBy: TMeasureBy;
}