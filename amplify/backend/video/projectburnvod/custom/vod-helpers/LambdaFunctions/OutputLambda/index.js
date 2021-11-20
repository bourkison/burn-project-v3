// https://stackoverflow.com/questions/67244764/how-can-i-use-iam-to-invoke-appsync-wtihin-aws-lambda

/* eslint-disable */
const AWS = require('aws-sdk');
const s3 = new AWS.S3({});
/* eslint-enable */
const fetch = require('node-fetch');
const { env } = require("process");
const URL = require("url");

const updateVideoObject = `mutation UpdateVideoObject(
            $input: UpdateVideoObjectInput!
            $condition: ModelVideoObjectConditionInput
    ) {
        updateVideoObject(input: $input, condition: $condition) {
            id
            loaded
        }
    }
`;


AWS.config.update({
    region: env.AWS_REGION,
    credentials: new AWS.Credentials(
        env.AWS_ACCESS_KEY_ID,
        env.AWS_SECRET_ACCESS_KEY,
        env.AWS_SESSION_TOKEN
    )
});

console.log("REGION", AWS.config.region);


/* eslint-disable */
exports.handler = async (event, context, callback) => {
/* eslint-enable */

/*
Function that triggers on the output bucket.

event.Records contains an array of S3 records that you can take action on.
*/
    const input = {
        id: "bourkison/7732236f-02bc-449f-8f4d-e398f922170e",
        loaded: true
    };
    
    const body = {
        query: updateVideoObject,
        operationName: 'updateVideoObject',
        variables: input
    }
    
    const uri = URL.parse(process.env.GRAPHQLEP);
    const httpRequest = new AWS.HttpRequest(uri.href, AWS.config.region);
    httpRequest.headers.host = uri.host;
    httpRequest.headers['Content-Type'] = 'application/json';
    httpRequest.method = 'POST';
    httpRequest.body = JSON.stringify(body);
    
    AWS.config.credentials.get(async () => {
        const signer = new AWS.Signers.V4(httpRequest, "appsync", true);
        signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate());

        const options = {
            method: httpRequest.method,
            body: httpRequest.body,
            headers: httpRequest.headers
        };
        
        console.log("BEFORE", options, uri.href);
        
        return fetch(uri.href, options).catch(err => { console.log ("ERROR:", err) });
        
        console.log("AFTER:", response);
    })



    // try {
    //     for (let i = 0; i < event.Records.length; i ++) {
    //         const record = event.Records[i];
    //         // Only do it if no underscores.
    //         console.log("***** Checking Key:", record.s3.object.key, record.s3.object.key.includes("_"), "*****");
            
    //         if (!record.s3.object.key.includes("_")) {
    //             let key = record.s3.object.key.split("/").splice(0, 2).join("/");
                
    //             console.log("************************************");
    //             console.log("SENDING REQUEST:", key);
    //             console.log("URL:", process.env.GRAPHQLEP);
    //             console.log("API-KEY", process.env.GRAPHQLID);
    //             console.log("************************************");
    
    //             const result = await axios({
    //                 url: process.env.GRAPHQLEP,
    //                 method: 'POST',
    //                 headers: {
    //                     'x-api-key': process.env.GRAPHQLID
    //                 },
    //                 data: {
    //                     query: print(updateVideoObject),
    //                     variables: {
    //                         input: {
    //                             id: key,
    //                             loaded: true
    //                         }
    //                     }
    //                 }
    //             });
                
    //             console.log("************************************");
    //             // console.log("RESPONSE:", result.data.errors);
    //             console.log("************************************")
    
    //         }
    //     }

    //     return {
    //         statusCode: 200,
    //         body: JSON.stringify({ success: true }),
    //         headers: {
    //             "Access-Control-Allow-Origin": "*"
    //         }
    //     }
    // }
    // catch(err) { 
    //     console.log(err.response.data.errors); 
    // }
};