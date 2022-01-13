import { IncomingMessage } from "connect"
import { ICreateExercise, ICreateTemplate } from "." 

// Exercise
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
        exerciseForm: ICreateExercise
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
        exerciseForm: ICreateExercise;
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

// Template
export type QueryTemplateParams = {
    init: QueryTemplateInit;
    req?: IncomingMessage
}

export type QueryTemplateInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters?: {
        loadAmount?: number;
        user?: boolean;
        muscleGroups?: string;
        tags?: string;
        startAt?: string;
    }
}

export type GetTemplateParams = {
    templateId: string;
    init: GetTemplateInit | {};
    req?: IncomingMessage;
}

export type GetTemplateInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters?: {
        counters?: boolean
    }
}

export type CreateTemplateParams = {
    init: CreateTemplateInit;
}

export type CreateTemplateInit = {
    headers?: {
        Authorization?: string
    };
    body: {
        templateForm: ICreateTemplate
    }
}