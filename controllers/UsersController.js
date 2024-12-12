import bull from 'bull';
import dbClient from '../utils/db';
import misc from '../utils/misc';

const queue = new bull('userQueue');

async function NewUser(req, res) {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  if (await dbClient.isUserValid(email)) {
    return res.status(400).json({ error: 'Already exist' });
  }

  const usr = await dbClient.CreateUser(email, password);
  await queue.add({ userId: usr.userId });

  res.status(201).json({ id: usr, email });
}

async function CurrentUser(req, res) {
  const id = await misc.curUsrId(req.headers);
  const user = await dbClient.GetByid(id);

  res.json({ id: user._id, email: user.email });
}

const userCtrls = {};
userCtrls.newUser = NewUser;
userCtrls.curUsr = CurrentUser;

export default userCtrls;
