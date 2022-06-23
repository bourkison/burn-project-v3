import { ExerciseReference } from "@/types/exercise";
import { IncomingMessage } from "connect"

// Template
export type CreateTemplate = {
    name: string;
    description: string;
    exerciseReferences: ExerciseReference[];
    difficulty: number;
    muscleGroups: string[];
    tags: string[];
    createdBy?: {
        username: string;
        userId: string;
        profilePhoto: string;
    }
}

export type Template = {
    _id: string;
    createdBy: {
        username: string;
        userId: string;
        profilePhoto: string;
    }
    description: string;
    difficulty: number;
    exerciseReferences: ExerciseReference[];
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
    createdAt: Date;
}

export type TemplateReference = {
    _id?: string
    templateId: string;
    name: string;
    muscleGroups: string[];
    tags: string[];
    createdBy: {
        username: string;
        userId: string;
        profilePhoto: string;
    };
    createdAt: Date;
    isFollow?: boolean;
    loaded?: boolean;
}

// ~~~~~~~~~~~~~~~~~~~~~~ API ~~~~~~~~~~~~~~~~~~~~~~
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
        templateForm: CreateTemplate
    }
}

export type EditTemplateParams = {
    templateId: string;
    init: EditTemplateInit;
}

export type EditTemplateInit = {
    headers?: {
        Authorization?: string
    }
    body: {
        templateForm: CreateTemplate;
    }
}

export type DeleteTemplateParams = {
    templateId: string;
    init: DeleteTemplateInit;
}

export type DeleteTemplateInit = {
    headers?: {
        Authorization?: string
    }
}