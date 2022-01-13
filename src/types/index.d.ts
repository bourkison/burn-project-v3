export type TMeasureBy = "repsWeight"|"reps"|"timeWeight"|"time"
export type TChartType = "recentWorkouts"|"exercise"

export interface IResponsiveDate {
    unit: ""|"day"|"week"|"month";
    amount: number;
    date: Date | null;
}

// Exercise
export interface ICreateExercise {
    name: string
    description: string
    difficulty: number
    measureBy: TMeasureBy
    filePaths: IFilePath[]
    muscleGroups: string[]
    tags: string[]
}

export interface IExercise {
    _id: string;
    createdBy: {
        username: string;
        userId: string;
    }
    description: string;
    difficulty: number;
    measureBy: TMeasureBy;
    name: string;
    filePaths: IFilePath[];
    muscleGroups: string[];
    tags: string[];
    likeCount: number;
    commentCount: number;
    followCount: number;
    usedAmount: number;
    public: boolean;
    isLiked: boolean;
    isFollowed: boolean;
    isFollowable: boolean;
}

// Chart
interface IChartData {
    preferenceIndex?: number;
    exercise?: {
        exerciseId: string;
        createdBy: {
            username: string;
            userId: string;
        }
        name: string;
        filePaths: IFilePath[];
        tags: string[];
        muscleGroups: string[]
    };
    dataToPull?: string;
}

export interface IChart {
    chartType: TChartType;
    startDate: IResponsiveDate;
    endDate: IResponsiveDate;
    interval: "day"|"week"|"month";
    backgroundColor: string;
    borderColor: string;
    pointBackgroundColor: string;
    data?: IChartData
}

export interface IFilePath {
    key: string
    fileType: "image"|"video"
}

export interface IImageToUpload {
    url: string;
    editable: boolean;
    id: number;
    path: string | null;
}