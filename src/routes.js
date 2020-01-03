import { Router } from 'express';

import LogController from './app/controllers/LogController';
import UserController from './app/controllers/UserController';

const routes = new Router();

routes.post('/controlid/notifications/dao', LogController.store);

routes.delete('/users/:id', UserController.remove);

export default routes;
