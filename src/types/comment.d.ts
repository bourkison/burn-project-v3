import { Like } from "@/types";

export type Comment = {
    _id: string,
    content: string;
    createdBy: {
        username: string;
        userId: string;
        profilePhoto: string;
    },
    createdAt: Date,
    likes: Like[];
    likeCount: number;
    isLiked: boolean;
}

// API
export type QueryCommentParams = {
    docId: string;
    init: QueryCommentInit;
}

export type QueryCommentInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters: {
        coll: string;
        loadAmount: number
    }
}

export type CreateCommentParams = {
    init: CreateCommentInit
}

export type CreateCommentInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters: {
        docId: string;
        coll: string;
    }
    body: {
        content: string
    }
}

export type DeleteCommentParams = {
    init: DeleteCommentInit;
}

export type DeleteCommentInit = {
    headers?: {
        Authorization?: string
    }
    queryStringParameters: {
        docId: string;
        coll: string;
        _id: string;
    }
}