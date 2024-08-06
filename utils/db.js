import pkg from 'mongodb';
import { env } from 'process';
import sha1 from 'sha1';

const { MongoClient } = pkg;

class DBClient {
    constructor() {
        const host = !env.DB_HOST ? 'localhost' : env.DB_HOST;
        const port = !env.DB_PORT ? '27017' : env.DB_PORT;
        const dbName = !env.DB_DATABASE ? 'files_manager' : env.DB_DATABASE;

        this.mongoC = new MongoClient(`mongodb://${host}:${port}`);
        (async () => {
            await this.mongoC.connect();
            this.db = this.mongoC.db(dbName);
        })();
    }

    isAlive() {
        return !!this.mongoC && !!this.mongoC.topology && this.mongoC.topology.isConnected();
    }

    async nbnUsers() {
        const num = this.db.collection('users').countDocuments();
        return num;
    }

    async nbFiles() {
        const num = await this.db.collection('files').countDocuments();
        return num;
    }

    async isUserValid(email, password = null) {
        const user = await this.db.collection('users').find({ email }).next();
        const validEmail = (user) != null;
        let validPass = true;
        if (user && password) { validPass = user.password === sha1(password); }
        return validEmail && validPass;
    }

    async CreateUser(email, password) {
        const user = await this.db.collection('users').insert({ email, password: sha1(password) });
        return user.insertedIds[0];
    }

    async GetUser(email) {
        const user = await this.db.collection('users').find({ email }).next();
        console.log(user, email);
        return user;
    }
}

const dbClient = new DBClient();

export default dbClient;
