const esbuild = require('esbuild');
const fs = require('node:fs');
esbuild.buildSync({entryPoints: [__dirname + '/client-source.js'], bundle: true, write: false, format: 'cjs', platform: 'browser', external: ['react'], target: 'es2022'}).outputFiles.forEach(file => {
  fs.writeFileSync(__dirname + '/client.js', 'window.__ModuleLoader__.load({id:"dsh-teamkb",factory:(require)=>{var module={exports:{}};var exports=module.exports;\n' + file.text + '\nreturn module.exports;}});\n');
});
