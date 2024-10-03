/*eslint-disable */
import pkg from 'mongodb';
import { env } from 'process';
import sha1 from 'sha1';

const { MongoClient, ObjectId } = pkg;

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

  async nbUsers() {
    const num = this.db.collection('users').countDocuments();
    return num;
  }

  async nbFiles() {
    const num = await this.db.collection('files').countDocuments();
    return num;
  }

  /**
     * Checks if user exists in DB
     * @returns True ( `user exists and`password` is valid (f passed) ) otherwise False
     */
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

  async CreateFile(data) {
    const file = await this.db.collection('files').insert(data);
    return file.insertedIds[0];
  }

  async UpdateDocument(query, collection) {
    if (query[0]._id) {
      query[0]._id = new ObjectId(query[0]._id);
    }
    await this.db.collection(collection).update(...query);
  }

  async GetFiles(query, single = true, page = 0) {
    if (query._id) {
      query._id = new ObjectId(query._id);
    }
    if (!single) {
      delete query.userId;
    }
    console.log(query);
    
    const docs = await this.db.collection('files').aggregate([
      { $match: query },
      {
        $addFields: {
          id: '$_id', // Create a new field _id
        },
      },
      { $project: { localPath: 0, _id: 0 } },
      { $skip: page },
      { $limit: 20 },
    ]).toArray();
    // if (docs) docs = docs.toArray();
    
    return single && docs ? docs[0] : docs;
  }

  async GetUserByEmail(email) {
    const user = await this.db.collection('users').find({ email }).next();
    return user;
  }

  async GetByid(id, coll = 'users') {
    const doc = await this.db.collection(coll).find({ _id: new ObjectId(id) }).next();
    return doc;
  }
}

const dbClient = new DBClient();

export default dbClient;
