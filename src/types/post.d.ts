import { FilePath } from "@/types";
import { IncomingMessage } from "connect";

// POST
export type Post = {
    _id: string;
    content: string;
    createdBy: {
        username: string;
        userId: string;
        profilePhoto: string;
    }
    filePaths: FilePath[];
    share?: {
        _id: string;
        coll: "post"|"exercise"|"template"|"workout"
    },
    likeCount: number;
    commentCount: number;
    createdAt: Date;
    isLiked: boolean;
}

export type PostReference = {
    _id: string;
    createdBy: {
        username: string;
        userId: string;
        profilePhoto: string;
    };
    createdAt: Date;
    loaded?: boolean;
}

export type CreatePost = {
    content: string;
    filePaths: FilePath[];
    share: {
        _id: string;
        coll: "post"|"exercise"|"template"|"workout"
    } | {}
}

// API
export type QueryPostParams = {
    req?: IncomingMessage,
    init: QueryPostInit
}

export type QueryPostInit = {
    headers?: {
        Authorization?: string
    },
    queryStringParameters: {
        loadAmount: number
        startAt?: string
        userId?: string
    }
}

export type GetPostParams = {
    postId: string;
    init: GetPostInit;
}

export type GetPostInit = {
    headers?: {
        Authorization?: string;
    }
}

export type CreatePostParams = {
    init: CreatePostInit
}

export type CreatePostInit = {
    headers?: {
        Authorization?: string
    },
    body: {
        postForm: CreatePost
    }
}