import dbClient from '../utils/db';
import redisClient from '../utils/redis';

function status(req, res) {
  const response = { redis: redisClient.isAlive(), db: dbClient.isAlive() };
  res.status(200).json(response);
}

async function stats(req, res) {
  const response = { users: await dbClient.nbUsers(), files: await dbClient.nbFiles() };
  res.status(200).json(response);
}
const appController = {};
appController.status = status;
appController.stats = stats;

export default appController;
