import { IncomingMessage } from "connect";

export type SearchResult = {
    user?: {
        _id: string;
        username: string;
    }[];
    exercise?: {
        _id: string;
        name: string;
    }[];
    template?: {
        _id: string;
        name: string;
    }[]
}

export type SearchParams = {
    req?: IncomingMessage;
    init: SearchInit
};

export type SearchInit = {
    headers?: {
        Authorization?: string;
    }
    queryStringParameters: {
        q: string;
        collections: string;
    }
}