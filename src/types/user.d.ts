import { CognitoUserSession } from "amazon-cognito-identity-js";
import { Chart } from "@/types";
import { IncomingMessage } from "connect"
import { Workout } from "@/types/workout";

// USER
export type LoggedInUser = {
    data: CognitoUserSession | null;
    docData: UserDocData | null;
    loggedIn: boolean;
}

export type UserDocData = {
    _id: string;
    username: string;
    country: string;
    dob: string;
    email: string;
    firstName: string;
    surname: string;
    gender: string;
    height: number;
    metric: boolean;
    options?: {
        charts?: {
            homepage?: {
                leftRail?: Chart[],
                rightRaight?: Chart[]
            },
            profile?: {
                leftRail?: Chart[],
                rightRaight?: Chart[]
            },
            workout?: {
                leftRail?: Chart[],
                rightRaight?: Chart[]
            },
        }
    };
    weight: number;
    workouts: Workout[]
}

export type UserProfile = {
    _id: string;
    username: string;
    followerCount: number
    followingCount: number;
    followers: UserReference[];
    options: {
        charts?: {
            profile?: {
                leftRail?: Chart[],
                rightRail?: Chart[]
            }
        }
    }
    isFollowed: boolean;
    isLoggedInUser: boolean;
}

export type UserReference = {
    username: string;
    userId: string;
    createdAt: Date;
    profilePhoto: string;
}

// API
export type GetUserParams = {
    userId: string;
    init: GetUserInit
    req?: IncomingMessage
}

export type GetUserInit = {
    headers?: {
        Authorization?: string
    };
    queryStringParameters?: {
        view?: string
    }
}