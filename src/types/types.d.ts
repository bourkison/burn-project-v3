export type TMeasureBy = "repsWeight"|"reps"|"timeWeight"|"time"

export interface ICreateExercise {
    name: string
    description: string
    difficulty: number
    measureBy: TMeasureBy
    filePaths: Array<IFilePath>
    muscleGroups: Array<string>
    tags: Array<string>
}

export interface IFilePath {
    key: string
    fileType: "image"|"video"
}