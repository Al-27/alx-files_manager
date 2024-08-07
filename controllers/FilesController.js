import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import misc from '../utils/misc';

async function UploadFile(req, res) {
  const metadata = req.body;
  const token = req.headers['x-token'];
  const id = await redisClient.get(`auth_${token}`);

  const err = (msg) => res.status(400).json({ error: msg });

  /// @parent: ID of parent root, 0(default) root
  metadata.parentId = metadata.parentId ? metadata.parentId : 0;
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
  if (metadata.parentId && metadata.parentId !== 0) {
    parFolder = await dbClient.GetByid(metadata.parentId, 'files');
    if (parFolder == null) { return err('Parent not found'); }
    if (parFolder.type !== 'folder') { return err('Parent is not a folder'); }
  }

  if (metadata.type === 'folder') {
    const fileid = await dbClient.CreateFile({ ownerID: id, ...metadata });
    return res.status(201).json({ id: fileid, ownerID: id, ...metadata });
  }

  const localPath = misc.createFile(metadata.data, parFolder ? parFolder.name : '');
  delete metadata.data;
  const fileid = await dbClient.CreateFile({ ownerID: id, ...metadata, localPath });
  return res.status(201).json({ id: fileid, ownerID: id, ...metadata });
}

const filesCtrls = {};
filesCtrls.upload = UploadFile;

export default filesCtrls;
