import { accessorType } from "~/store";

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
    exercise?: {
        exerciseId: string;
        createdBy: {
            username: string;
            userId: string;
        }
        name: string;
        filePaths: FilePath[];
        tags: string[];
        muscleGroups: string[]
    };
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