import { Router } from 'express';

import LogController from './app/controllers/LogController';
import UserController from './app/controllers/UserController';
import RulesController from './app/controllers/RulesController';

const routes = new Router();

routes.post('/controlid/notifications/dao', LogController.store);

routes.post('/users/reply', UserController.reply);
routes.delete('/users/:id', UserController.remove);

routes.post('/rules/:id_user', RulesController.store);
routes.delete('/rules/:id_user', RulesController.remove);
routes.put('/rules/:id_user', RulesController.update);

export default routes;
