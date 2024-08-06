import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function ValidToken(req, res, next) {
    const xToken = req.headers['x-token'];
    switch (req.url) {
    case '/disconnect':
    case '/users/me':
        if (xToken == null || (await redisClient.get(`auth_${xToken}`)) == null) {
            return res.status(401).send(`${JSON.stringify({ error: 'Unathorized' })}\n`);
        }
        break;
    default:
        break;
    }
    next();
}

async function Connect(req, res) {
    const { email, password } = req.body;
    const isValid = await dbClient.isUserValid(email, password);
    if (!isValid) {
        return res.status(401).send(`${JSON.stringify({ error: 'Unathorized' })}\n`);
    }
    const token = v4();
    const tokenk = `auth_${token}`;
    // const id = (await dbClient.GetUser(email))._id;
    redisClient.set(tokenk, email, 3600 * 24);
    res.status(200).send(`${JSON.stringify({ token })}\n`);
}

async function Disconnect(req, res) {
    const token = `auth_${req.headers['x-token']}`;
    console.log('disc');
    await redisClient.del(token);
    res.status(204).send();
}

const authCtrls = {};
authCtrls.connect = Connect;
authCtrls.disconnect = Disconnect;
authCtrls.validToken = ValidToken;
export default authCtrls;
