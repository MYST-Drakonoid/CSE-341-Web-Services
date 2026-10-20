import 'dotenv/config';
import { initializeCollections } from './setup.js';
import { MongoClient } from 'mongodb'; 

let _db;

export const initDb = async (callback) => { 
    // this function will be called from the server.js file to initialize the database connection
    if (_db) {
        console.log("Database is already initialized!");
        return callback(null, _db);
    }

    const dbId = process.env.DB;
    try {
        const client = await MongoClient.connect(dbId);
        _db = client.db('household_inventory');

        console.log("Connected database:", _db.databaseName);

        // this is where we initialize the collections in the database

        await initializeCollections(_db);

        callback(null, _db);
    } catch (err) {
        callback(err);
    }
};

export const getDb = () => { 
    // this function will be called from the server.js file to get the database connection

    if (!_db) {
        throw Error("Database not initialized");
    }
    return _db;
};

    // module.exports = {
    //     initDb,
    //     getDb
    // };