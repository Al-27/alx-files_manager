import {
  mkdirSync, writeFile, createReadStream, statSync, constants, accessSync,
} from 'fs';
import path from 'path';
import { env } from 'process';
import { v4 } from 'uuid';
import { contentType } from 'mime-types';
import redisClient from './redis';

function CreateFile(file, parent = '') {
  let localPath = env.FOLDER_PATH ? env.FOLDER_PATH : '/tmp/files_manager';
  localPath = path.join(localPath, parent);
  const folderPath = path.join(localPath);
  mkdirSync(folderPath, { recursive: true });
  const uuid = v4();
  const data = Buffer.from(file, 'base64');
  writeFile(path.join(folderPath, uuid), data, (er) => { if (er) console.log(er); });

  return path.join(localPath, uuid);
}

function GetFileData(localPath) {
  const filePath = path.join(require.main.path, localPath);

  try {
    /*eslint-disable */
    accessSync(filePath, constants.R_OK | constants.W_OK);
  } catch (err) {
    return null;
  }
  const props = statSync(filePath);

  const data = {};
  data.headers = {
    'Content-Type': contentType(localPath),
    'Content-Length': props.size,
  };

  data.readstrm = createReadStream(filePath);

  return data;
}

async function GetUserId(hdrs) {
  const token = hdrs['x-token'];
  const id = await redisClient.get(`auth_${token}`);
  return id;
}

const misc = {};
misc.createFile = CreateFile;
misc.getFileData = GetFileData;
misc.curUsrId = GetUserId;

export default misc;
