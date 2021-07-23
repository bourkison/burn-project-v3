const mongoose = require('./nodejs/node_modules/mongoose');

let cachedConn = null;

module.exports = async (uri) => {
    console.log("Beginning connection:", uri);
    
    if (cachedConn) {
        console.log("Returning cached connection.");
        return cachedConn;
    }

    const conn = await mongoose.createConnection(uri, { 
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000
    });

    console.log("Connection successful. Caching and returning.");

    cachedConn = conn;
    return cachedConn;
}