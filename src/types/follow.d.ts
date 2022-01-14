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