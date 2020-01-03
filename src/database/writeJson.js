const fs = require('fs');


const devices = [
  { id: 2004177769210810, ip: "192.168.0.220" },
  { id: 2004177769209720, ip: "192.168.0.221" },
  { id: 2004177769209702, ip: "192.168.0.222" },
  { id: 2004177769209696, ip: "192.168.0.223" },
  { id: 2004177769209728, ip: "192.168.0.224" },
]

const init = async () => {

  await fs.writeFileSync('./devices.json', JSON.stringify(devices), 'utf-8');
  const file = await fs.readFileSync('./devices.json', 'utf-8');
  const json = JSON.parse(file);

  console.log(json);
}

init();
