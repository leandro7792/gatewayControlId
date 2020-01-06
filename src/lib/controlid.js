import fetch from 'node-fetch';

class ControlId {
  constructor(ip, login, password) {
    this.ip = ip;
    this.base_url = `http://${ip}/`;
    this.login = login;
    this.password = password;
  }

  async logon() {
    const { login, password } = this;
    const response = await this.post('login.fcgi', { login, password });
    const { session } = response;
    this.session = session;
    return session;
  }

  async logout() {
    const { session } = await this.post('logout.fcgi', {});
    return session;
  }

  openSecBox(timeToClose) {
    const endpoint = 'execute_actions.fcgi';
    const json = {
      actions: [
        {
          action: 'sec_box',
          parameters: `id=65793,reason=3,timeout=${timeToClose}`,
        },
      ],
    };
    return this.post(endpoint, json);
  }

  getObjects(object, where = {}) {
    const endPoint = 'load_objects.fcgi';
    const json = { object, where };
    return this.post(endPoint, json);
  }

  newObjects(object, values) {
    const endPoint = 'create_objects.fcgi';
    const json = { object, values };
    return this.post(endPoint, json);
  }

  removeObjects(object, where = {}) {
    const endPoint = 'destroy_objects.fcgi';
    const json = { object, where };
    return this.post(endPoint, json);
  }

  updateObjects(object, where = {}, values) {
    const endPoint = 'modify_objects.fcgi';
    const json = { object, values, where };
    return this.post(endPoint, json);
  }

  remote_enroll(userId) {
    const endPoint = 'remote_enroll.fcgi';
    const json = {
      type: 'biometry',
      user_id: userId,
      message: 'Posicione o indicador no leitor.',
      save: false,
      sync: true,
      panic_finger: 0,
    };
    return this.post(endPoint, json);
  }

  remote_enroll_panic(userId) {
    const endPoint = 'remote_enroll.fcgi';
    const json = {
      type: 'biometry',
      user_id: userId,
      message: 'Posicione o dedo do PANICO.',
      save: false,
      sync: true,
      panic_finger: 1,
    };
    return this.post(endPoint, json);
  }

  async upInsert(object, where, values) {
    const response_search_user = await this.getObjects(object, where);
    const user = response_search_user[object];

    if (Array.isArray(user) && user.length) {
      // existe, entao atualiza
      await this.updateObjects(object, where, values);
      return user[0].id;
    }
    // não existe, então cria
    const newObject = await this.newObjects(object, [values]);
    return newObject.ids[0];
  }

  async post(endpoint, json) {
    const { base_url, session } = this;
    const body = JSON.stringify(json);
    const url = session
      ? `${base_url + endpoint}?session=${session}`
      : base_url + endpoint;
    const result = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!result.ok) {
      const { status } = result;

      if (status === 401)
        throw new Error(
          `Houve um erro de autenticação no dispositivo de ip ${this.ip}`
        );
    }

    return result.text().then(text => (text ? JSON.parse(text) : {}));
  }
}

export default ControlId;
