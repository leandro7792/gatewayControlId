export const base64url_decode = data => {
  const decoded = Buffer.from(data, 'base64').toString('ascii');

  const originalData = decoded
    .replace('in(*@3924n1!|', '')
    .replace('|JD123@321*#627', '');

  return originalData;
};

export const base64url_encode = data => { };
