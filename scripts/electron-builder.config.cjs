/**
 * @type {() => import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = async function () {
  return {
    directories: {
      output: 'dist-electron',
      buildResources: 'buildResources',
    },
    files: ['electron/**/dist/**', 'dist/**'],

    linux: {
      target: 'deb',
    },
  };
};
