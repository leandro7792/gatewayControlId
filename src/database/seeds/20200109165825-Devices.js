module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert(
      'Devices',
      [
        {
          idDevice: '2004177769209717', // dev
          ip: '192.168.1.223',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // {
        //   idDevice: '2004177769210810',
        //   ip: '192.168.0.220',
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        // },
        // {
        //   idDevice: '2004177769209720',
        //   ip: '192.168.0.221',
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        // },
        // {
        //   idDevice: '2004177769209702',
        //   ip: '192.168.0.222',
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        // },
        // {
        //   idDevice: '2004177769209696',
        //   ip: '192.168.0.223',
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        // },
        // {
        //   idDevice: '2004177769209728',
        //   ip: '192.168.0.224',
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        // },
        // {
        //   idDevice: '2004173474249974',
        //   ip: '192.168.0.226',
        //   createdAt: new Date(),
        //   updatedAt: new Date(),
        // },
      ],
      {}
    );
  },

  down: queryInterface => {
    return queryInterface.bulkDelete('Devices', null, {});
  },
};
