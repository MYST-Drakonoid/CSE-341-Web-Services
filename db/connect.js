import 'dotenv/config';
import { MongoClient } from 'mongodb'; 

let _db;

export const initDb = async (callback) => {
    if (_db) {
        console.log("Database is already initialized!");
        return callback(null, _db);
    }

    const dbId = process.env.DB;
    try {
        const client = await MongoClient.connect(dbId);
        _db = client.db('mongodbVSCodePlaygroundDB');

        console.log("Connected database:", _db.databaseName);

        callback(null, _db);
    } catch (err) {
        callback(err);
    }
};

export const getDb = () => {
    if (!_db) {
        throw Error("Database not initialized");
    }
    return _db;
};

    // module.exports = {
    //     initDb,
    //     getDb
    // };