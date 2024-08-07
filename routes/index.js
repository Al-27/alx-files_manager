import express from 'express';
import appController from '../controllers/AppController';
import userCtrls from '../controllers/UsersController';
import authCtrls from '../controllers/AuthController';
import filesCtrls from '../controllers/FilesController';

const routes = express.Router();

routes.all('*', authCtrls.validToken);

routes.get('/status', appController.status);
routes.get('/stats', appController.stats);

routes.get('/connect', authCtrls.connect);
routes.get('/disconnect', authCtrls.disconnect);

routes.get('/users/me', userCtrls.curUsr);
routes.post('/users', userCtrls.newUser);

routes.post('/files', filesCtrls.upload);
export default routes;
