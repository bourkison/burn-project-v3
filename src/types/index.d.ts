import { accessorType } from "~/store";
import { CognitoUserSession } from "amazon-cognito-identity-js";

export type TMeasureBy = "repsWeight"|"reps"|"timeWeight"|"time"
export type TChartType = "recentWorkouts"|"exercise"

export type HTMLElementEvent<T extends HTMLElement> = Event & {
    target: T; 
    currentTarget: T;
}

declare module 'vue/types/vue' {
    interface Vue {
      $accessor: typeof accessorType
    }
  }
  
  declare module '@nuxt/types' {
    interface NuxtAppOptions {
      $accessor: typeof accessorType
    }
  }

export type IResponsiveDate = {
    unit: ""|"day"|"week"|"month";
    amount: number;
    date: Date | null;
}

// USER
export type IUserProfile = {
    data: CognitoUserSession | null;
    docData: IUserDocData | null;
    loggedIn: boolean;
}

export type IUserDocData = {
    _id: string;
    username: string;
    country: string;
    dob: string;
    email: string;
    firstName: string;
    surname: string;
    gender: string;
    height: number;
    metric: boolean;
    options?: {
        charts?: {
            homepage?: {
                leftRail?: IChart,
                rightRaight?: IChart
            },
            profile?: {
                leftRail?: IChart,
                rightRaight?: IChart
            },
            workout?: {
                leftRail?: IChart,
                rightRaight?: IChart
            },
        }
    };
    weight: number;
    workouts: IWorkout[]
}

// Exercise
export type ICreateExercise = {
    name: string
    description: string
    difficulty: number
    measureBy: TMeasureBy
    filePaths: IFilePath[]
    muscleGroups: string[]
    tags: string[]
    createdBy?: {
        username: string;
        userId: string;
    }
}

export type IExercise = {
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

export type IExerciseReference = {
    _id?: string
    exerciseId: string;
    name: string;
    muscleGroups: string[];
    tags: string[];
    createdBy: {
        username: string;
        userId: string;
    }
    createdAt: Date;
    isFollow?: boolean;
    loaded?: boolean; // Used to let page know if component loaded.
}

// Template
export type ICreateTemplate = {
    name: string;
    description: string;
    exerciseReferences: IExerciseReference[];
    difficulty: number;
    muscleGroups: string[];
    tags: string[];
    createdBy?: {
        username: string;
        userId: string;
    }
}

export type ITemplate = {
    _id: string;
    createdBy: {
        username: string;
        userId: string;
    }
    description: string;
    difficulty: number;
    exerciseReferences: IExerciseReference[];
    muscleGroups: string[];
    name: string;
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

export type ITemplateReference = {
    _id?: string
    templateId: string;
    name: string;
    muscleGroups: string[];
    tags: string[];
    createdBy: {
        username: string;
        userId: string
    };
    createdAt: Date;
    isFollow?: boolean;
    loaded?: boolean;
}

// Workout
export type IWorkout = {
    duration: number;
    name: string;
    notes: string;
    recordedExercises: IRecordedExercise[]
    uniqueExercises: string[];
    options?: {
        charts?: IChart[]
    }[]
    templateReference: ITemplateReference;
    public: boolean;
}

export type IRecordedExercise = {
    exerciseReference: IExerciseReference;
    notes: string;
    options: {
        measureBy: TMeasureBy;
        weightUnit: "kg"|"lb"
    }
    sets: IRecordedSet[]
}

export type IRecordedSet = {
    weightAmount: number;
    measureAmount: number;
    measureBy: TMeasureBy;
}

// Chart
type IChartData = {
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

export type IChart = {
    chartType: TChartType;
    startDate: IResponsiveDate;
    endDate: IResponsiveDate;
    interval: "day"|"week"|"month";
    backgroundColor: string;
    borderColor: string;
    pointBackgroundColor: string;
    data?: IChartData
}

export type IFilePath = {
    key: string
    fileType: "image"|"video"
}

export type IImageToUpload = {
    url: string;
    editable: boolean;
    id: number;
    path: IFilePath | null;
}