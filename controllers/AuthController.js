import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function ValidToken(req, res, next) {
  const xToken = req.headers['x-token'];
  switch (req.url) {
    case '/disconnect':
    case '/users/me':
    case '/files':
      if (xToken == null || (await redisClient.get(`auth_${xToken}`)) == null) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      break;
    default:
      break;
  }
  next();
}

async function Connect(req, res) {
  let base64 = req.headers.authorization.replace('Basic ', '');
  base64 = Buffer.from(base64, 'base64').toString('ascii').split(':');
  if (base64.length < 2) base64 = ['fa', 'il'];

  const email = base64[0];
  const password = base64[1];
  const isValid = await dbClient.isUserValid(email, password);
  console.log(isValid);
  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = v4();
  const tokenk = `auth_${token}`;
  const id = (await dbClient.GetUserByEmail(email))._id;
  redisClient.set(tokenk, id, 3600 * 24);
  res.status(200).json({ token });
}

async function Disconnect(req, res) {
  const token = `auth_${req.headers['x-token']}`;
  await redisClient.del(token);
  res.status(204).send();
}

const authCtrls = {};
authCtrls.connect = Connect;
authCtrls.disconnect = Disconnect;
authCtrls.validToken = ValidToken;
export default authCtrls;
