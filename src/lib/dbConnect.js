import mongoose from "mongoose";

const connection = {}; // creating connection object

async function dbConnect() {
    try {
        // Check if MONGODB_URI is set
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        if (connection.isConnected) {
            console.log("Already connected to the database");
            return; // if we are already connected to the database then we are returning from the function
        }
        
        console.log("Connecting to MongoDB...");
        const db = await mongoose.connect(process.env.MONGODB_URI);

        console.log("Database connected successfully");
        connection.isConnected = db.connections[0].readyState;
    } catch (error) {
        console.error("DB connection failed:", error.message); // if the connection fails then we are logging the error
        console.error("Stack trace:", error.stack);
        // Don't exit the process in production as it would crash the server
        if (process.env.NODE_ENV !== 'production') {
            console.error("Exiting process due to database connection failure");
            process.exit(1);
        }
    }
}

export default dbConnect;
// this file is used to connect to the database using mongoose