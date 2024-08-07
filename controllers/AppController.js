import dbClient from '../utils/db';
import redisClient from '../utils/redis';

function status(req, res) {
    const response = `${JSON.stringify({ redis: redisClient.isAlive(), db: dbClient.isAlive() })}\n`;
    res.status(200).send(response);
}

async function stats(req, res) {
    const response = `${JSON.stringify({ users: await dbClient.nbnUsers(), files: await dbClient.nbFiles() })}\n`;
    res.status(200).send(response);
}
const appController = {};
appController.status = status;
appController.stats = stats;

export default appController;
