const NWT_APP = /^NWT_APP_/i;

const getClientEnv = (additionalVars) => {
  const raw = Object.keys(process.env)
    .filter(key => NWT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        NODE_ENV: process.env.NODE_ENV || 'development',
        ...additionalVars
      }
    );
  // Stringify all values so we can feed into webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };
  return { raw, stringified };
}

module.exports = getClientEnv;
