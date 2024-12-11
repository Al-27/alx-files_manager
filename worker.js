import bull from "bull";
import dbClient from './utils/db';
import misc from './utils/misc';
import { writeFileSync } from 'fs'
import imageThumbnail from 'image-thumbnail';

const fqueue = new bull('fileQueue');
const uqueue = new bull('userQueue');

fqueue.process(async (job, done) => {
    let fileId = null;
    let userId = null;

    fileId = job.data?.fileId;
    userId = job.data?.userId;

    if (!fileId)
        throw new Error('Missing fileId');
    if (!userId)
        throw new Error('Missing userId');


    let file = await dbClient.GetByid(fileId, 'files');

    if (!file || file.userId != userId)
        throw new Error('File not Found');

    let sizes = [500, 250, 100];

    for (let s of sizes) {
        let filePath = file.localPath
        let img_thmb = await imageThumbnail(filePath, { width: s, height: s });
        writeFileSync(`${filePath}_${s}`, img_thmb);
    }
    done();

});

uqueue.process(async (job, done) => {
    let userId = null;

    userId = job.data?.userId;

    if (!userId)
        throw new Error('Missing userId');

    let user = await dbClient.GetByid(userId);

    if (!user)
        throw new Error('User not Found');

    console.log(`Welcome ${user.email}!`);

    done();
})