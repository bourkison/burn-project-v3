import { TMeasureBy, FilePath } from "@/types";
import { IncomingMessage } from "connect"

// Exercise
export type CreateExercise = {
    name: string
    description: string
    difficulty: number
    measureBy: TMeasureBy
    filePaths: FilePath[]
    muscleGroups: string[]
    tags: string[]
    createdBy?: {
        username: string;
        userId: string;
    }
}

export type Exercise = {
    _id: string;
    createdBy: {
        username: string;
        userId: string;
    }
    description: string;
    difficulty: number;
    measureBy: TMeasureBy;
    name: string;
    filePaths: FilePath[];
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
    createdAt: Date
}

export type ExerciseReference = {
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


// ~~~~~~~~~~~~~~~~~~~ API ~~~~~~~~~~~~~~~~~~~
export type QueryExerciseParams = {
    init: QueryExerciseInit;
    req?: IncomingMessage
}

export type QueryExerciseInit = {
    headers?: {
        Authorization?: string;
    }
    queryStringParameters?: {
        loadAmount?: number;
        user?: boolean;
        muscleGroups?: string;
        tags?: string;
        startAt?: string
    }
}

export type GetExerciseParams = {
    exerciseId: string;
    init: GetExerciseInit | {};
    req?: IncomingMessage
}

export type GetExerciseInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters?: {
        counters?: boolean
    }
}

export type CreateExerciseParams = {
    init: CreateExerciseInit
};

export type CreateExerciseInit = {
    headers?: {
        Authorization?: string
    },
    body: {
        exerciseForm: CreateExercise
    }
}

export type EditExerciseParams = {
    exerciseId: string;
    init: EditExerciseInit;
}

export type EditExerciseInit = {
    headers?: {
        Authorization?: string
    }
    body: {
        exerciseForm: CreateExercise;
        imagesToDelete: string[]
    }
}

export type DeleteExerciseParams = {
    init: DeleteExerciseInit | {};
    exerciseId: string
}

export type DeleteExerciseInit = {
    headers?: {
        Authorization?: string
    }
}