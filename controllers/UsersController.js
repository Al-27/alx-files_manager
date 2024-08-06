import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function NewUser(req, res) {
    const { email, password } = req.body;
    if (!email) {
        return res.status(400).send(`${JSON.stringify({ error: 'Missing email' })}\n`);
    }

    if (!password) {
        return res.status(400).send(`${JSON.stringify({ error: 'Missing email' })}\n`);
    }

    if (await dbClient.isUserValid(email)) {
        return res.status(400).send(`${JSON.stringify({ error: 'Already exist' })}\n`);
    }
    const id = await dbClient.CreateUser(email, password);
    res.status(201).send(`${JSON.stringify({ id, email })}\n`);
}

async function CurrentUser(req, res) {
    const token = req.headers['x-token'];
    const email = await redisClient.get(`auth_${token}`);
    const user = await dbClient.GetUser(email);

    res.send(JSON.stringify({ id: user._id, email: user.email }));
}

const userCtrls = {};
userCtrls.newUser = NewUser;
userCtrls.curUsr = CurrentUser;

export default userCtrls;
