import { mkdirSync, writeFile } from 'fs';
import path from 'path';
import { env } from 'process';
import { v4 } from 'uuid';
import redisClient from './redis';

function CreateFile(file, parent = '') {
  const localPath = env.FOLDER_PATH ? env.FOLDER_PATH : '/tmp/files_manager';
  const folderPath = path.join(require.main.path, localPath, parent);
  mkdirSync(folderPath, { recursive: true });
  const uuid = v4();
  const data = Buffer.from(file, 'base64');
  writeFile(path.join(folderPath, uuid), data, (er) => { if (er) console.log(er); });

  return path.join(localPath, uuid);
}

async function GetUserId(hdrs) {
  const token = hdrs['x-token'];
  const id = await redisClient.get(`auth_${token}`);
  return id;
}

const misc = {};
misc.createFile = CreateFile;
misc.curUsrId = GetUserId;

export default misc;
