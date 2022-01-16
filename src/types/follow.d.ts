export type Follow = {
    userId: string;
    username: string;
    profilePhoto: string;
    createdAt: Date;
}

export type QueryFollowParams = {
    docId: string;
    init: QueryFollowInit;
}

export type QueryFollowInit = {
    headers?: {
        Authorization?: string;
    }
    queryStringParameters: {
        coll: string;
        loadAmount: number;
    }
}

export type FollowParams = {
    init: FollowInit
}

export type FollowInit = {
    headers?: {
        Authorization?: string
    };
    queryStringParameters: {
        docId: string;
        coll: string
    }
}