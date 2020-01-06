import { Router } from 'express';

import LogController from './app/controllers/LogController';
import UserController from './app/controllers/UserController';
import RulesController from './app/controllers/RulesController';

const routes = new Router();

routes.post('/controlid/notifications/dao', LogController.store);

routes.delete('/users/:id', UserController.remove);

routes.post('/rules/:id_user', RulesController.store);

export default routes;
