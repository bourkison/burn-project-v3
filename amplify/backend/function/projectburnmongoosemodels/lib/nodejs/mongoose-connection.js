const mongoose = require('mongoose');

let conn = null;

module.exports = async (uri) => {
    console.log("Beginning connection:", uri);
    
    if (conn === null) {
        conn = mongoose.createConnection(uri, { 
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000
        });
    }

    return await conn;
}