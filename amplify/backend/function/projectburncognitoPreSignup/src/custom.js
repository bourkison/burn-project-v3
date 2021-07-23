exports.handler = (event, context, callback) => {
    // insert code to be executed by your lambda trigger
    console.log(event)

    callback(null, event);
};
