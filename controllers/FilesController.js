import { del } from 'request';
import dbClient from '../utils/db';
import misc from '../utils/misc';

async function UploadFile(req, res) {
  const metadata = req.body;
  const id = await misc.curUsrId(req.headers);

  const err = (msg) => res.status(400).json({ error: msg });

  /// @parent: ID of parent root, 0(default) root
  metadata.parentId = metadata.parentId || 0;
  metadata.isPublic = metadata.isPublic ? metadata.isPublic : false;
  let parFolder = null;
  if (!metadata.name) {
    return err('Missing name');
  }
  if (!metadata.type) {
    return err('Missing type');
  }
  if (!metadata.data && metadata.type !== 'folder') {
    return err('Missing data');
  }
  // eslint-disable-next-line eqeqeq
  if (metadata.parentId != 0) {
    parFolder = await dbClient.GetByid(metadata.parentId, 'files');
    if (parFolder == null) { return err('Parent not found'); }
    if (parFolder.type !== 'folder') { return err('Parent is not a folder'); }
  }

  if (metadata.type === 'folder') {
    const fileid = await dbClient.CreateFile({ userId: id, ...metadata });
    return res.status(201).json({ id: fileid, userId: id, ...metadata });
  }
  const localPath = misc.createFile(metadata.data, parFolder ? parFolder.name : ''); 
  delete metadata.data;
  const fileid = await dbClient.CreateFile({ userId: id, ...metadata, localPath });
  return res.status(201).json({ id: fileid, userId: id, ...metadata });
}

async function GetFile(req, res) {
  const { id } = req.params;
  const file = await dbClient.GetByid(id);
  const usrId = await misc.curUsrId(req.headers);
  if (!file) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (file.userId !== usrId) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(file);
}

async function GetAll(req, res) {
  const parentId = req.query.parentId;
  const page = req.query.page * 20 - 1 || 0;
  const userId = await misc.curUsrId(req.headers);
  const query = {userId, parentId};
  if(!parentId) delete query.parentId;
  
  const files = await dbClient.GetFiles(query, false, page); 
  
  if (!files) return res.status(401).json({ error: 'Unauthorized' });

  res.json(files);
}

const filesCtrls = {};
filesCtrls.upload = UploadFile;
filesCtrls.getFile = GetFile;
filesCtrls.getAll = GetAll;

export default filesCtrls;
