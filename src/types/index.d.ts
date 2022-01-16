import { accessorType } from "~/store";
import { ExerciseReference } from "./exercise";

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

export type ResponsiveDate = {
    unit: ""|"day"|"week"|"month";
    amount: number;
    date: Date | null;
}

// Chart
type ChartData = {
    preferenceIndex?: number;
    exercise?: ExerciseReference;
    dataToPull?: string;
}

export type Chart = {
    chartType: TChartType;
    startDate: ResponsiveDate;
    endDate: ResponsiveDate;
    interval: "day"|"week"|"month";
    backgroundColor: string;
    borderColor: string;
    pointBackgroundColor: string;
    data?: ChartData
}

export type FilePath = {
    key: string
    fileType: "image"|"video"
}

export type ImageToUpload = {
    url: string;
    editable: boolean;
    id: number;
    path: FilePath | null;
}

// Comment
export type Like = {
    createdBy: {
        username: string;
        userId: string;
        profilePhoto: string;
    }
}

export type Follow = {
    userId: string;
    username: string;
    profilePhoto: string;
    createdAt: Date;
}

// Like API
export type QueryLikeParams = {
    init: QueryLikeInit;
    docId: string;
}

export type QueryLikeInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters: {
        coll: string;
        commentId?: string;
        loadAmount: number;
    }
}

export type CreateLikeParams = {
    init: CreateLikeInit
}

export type CreateLikeInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters: {
        docId: string;
        coll: string;
    }
}

export type DeleteLikeParams = {
    init: DeleteLikeInit
}

export type DeleteLikeInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters: {
        docId: string;
        coll: string;
    }
}