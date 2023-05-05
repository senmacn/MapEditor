function getVersion() {
  return process.env.npm_package_version;
}

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
    files: [
      'electron/**/dist/**',
      'dist/**',
      '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
      '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
      '!**/node_modules/*.d.ts',
      '!**/node_modules/.bin',
      '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
      '!.editorconfig',
      '!**/._*',
      '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
      '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
      '!**/{appveyor.yml,.travis.yml,circle.yml}',
      '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}',
    ],
    icon: 'buildResources/map256.ico',
    win: {
      artifactName: 'mapeditor-win.${ext}',
      icon: 'buildResources/map256.ico',
      target: [
        {
          // 打包成一个独立的 exe 安装程序
          target: 'nsis',
          // 这个意思是打出来32 bit + 64 bit的包，但是要注意：这样打包出来的安装包体积比较大，所以建议直接打32的安装包。
          arch: [
            // 'x64',
            'ia32',
          ],
        },
        {
          target: 'portable',
        },
      ],
    },
    mac: {
      // 应用程序包名
      artifactName: 'mapeditor-mac.${ext}',
      icon: 'buildResources/map256.ico',
      target: [
        // 要打的包的格式类型设置
        'dmg',
        'zip', // 这里注意更新的时候，mac只认zip格式的包
      ],
    },
    extraMetadata: {
      version: getVersion(),
    },
    nsis: {
      // NSIS的路径包括自定义安装程序的脚本。默认为build/installer.nsh
      include: 'buildResources/installer.nsh',
      // 是否一键安装，建议为 false，可以让用户点击下一步、下一步、下一步的形式安装程序，如果为true，当用户双击构建好的程序，自动安装程序并打开，即：一键安装（one-click installer）
      oneClick: false,
      // 是否开启安装时权限限制（此电脑或当前用户）
      perMachine: true,
      // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
      allowElevation: false,
      // 允许修改安装目录，建议为 true，是否允许用户改变安装目录，默认是不允许
      allowToChangeInstallationDirectory: true,
      // 卸载时删除用户数据
      deleteAppDataOnUninstall: true,
      // 安装图标
      // installerIcon: 'build/installerIcon_120.ico',
      // 卸载图标
      // uninstallerIcon: 'build/uninstallerIcon_120.ico',
      // 安装时头部图标
      // installerHeaderIcon: 'build/installerHeaderIcon_120.ico',
      // 创建桌面图标
      createDesktopShortcut: true,
      // 创建开始菜单图标
      createStartMenuShortcut: true,
    },
  };
};
