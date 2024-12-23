/*eslint-disable */
import Queue from 'bull';
import dbClient from '../utils/db';
import misc from '../utils/misc';

const queue = new Queue('fileQueue');


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
    if (parFolder.type != 'folder') { return err('Parent is not a folder'); }
  }

  if (metadata.type == 'folder') {
    const folderid = await dbClient.CreateFile({ userId: id, ...metadata });
    return res.status(201).json({ id: folderid, userId: id, ...metadata });
  }
  const localPath = misc.createFile(metadata.data, parFolder ? parFolder.name : '');
  delete metadata.data;
  const fileid = await dbClient.CreateFile({ userId: id, ...metadata, localPath });

  if (metadata.type == 'image')
    await queue.add({ fileId: fileid, userId, type: metadata.type });

  return res.status(201).json({ id: fileid, userId: id, ...metadata });
}

async function GetFile(req, res, next) {
  const { id } = req.params;
  const file = await dbClient.GetByid(id, "files");
  const usrId = await misc.curUsrId(req.headers);
  if (!usrId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!file || file.userId != usrId) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(file);
}

async function GetData(req, res) {
  let { id, size } = req.params;
  const file = await dbClient.GetByid(id, "files");
  const usrId = await misc.curUsrId(req.headers);
  //Delete this section
  const queue = new Queue('img-queue');
  await queue.add({ fileId: id, userId: usrId });
  //END
  if (!file || !(file.userId == usrId) && !file.isPublic) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (file.type == 'folder') {
    return res.status(400).json({ error: "A folder doesn't have content" });
  }

  if (file.type == 'image') {
    let sz = 0;
    if (size) {
      sz = parseInt(size)
      size = '_'+ size;
      //if wrong size is passed, ensure the original image is return instead
      if (![500, 250, 100].includes(sz))
        size = '';
    }
  }
  else
    size = '';
    
  const data = misc.getFileData(file.localPath+size);

  if (!data) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.writeHead(200, data.headers);
  data.readstrm.pipe(res);
}

async function GetAll(req, res) {
  const { parentId } = req.query;
  const page = req.query.page * 20 || 0;
  const userId = await misc.curUsrId(req.headers);
  const query = { userId, parentId };
  if (!parentId) delete query.parentId;
  
  const files = await dbClient.GetFiles(query, false, page);

  if (!files) return res.status(401).json({ error: 'Unauthorized' });
  // console.log(files);
  res.json(files);
}

async function SetPublish(req, res, publish) {
  const { id } = req.params;
  const file = await dbClient.GetFiles({ _id: id });
  const userId = await misc.curUsrId(req.headers);

  if (file && file.userId == userId) {
    await dbClient.UpdateDocument([{ _id: id }, { $set: { isPublic: publish } }], 'files');
    file.isPublic = publish;
    return res.status(200).json(file);
  }
  return res.status(404).json({ error: 'Not found' });
}
const filesCtrls = {};
filesCtrls.upload = UploadFile;
filesCtrls.getFile = GetFile;
filesCtrls.getData = GetData;
filesCtrls.getAll = GetAll;
filesCtrls.publish = async (req, res) => await SetPublish(req, res, true);
filesCtrls.unpublish = async (req, res) => await SetPublish(req, res, false);

export default filesCtrls;
