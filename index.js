#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const { prompt } = require('inquirer');
const fs = require('fs');
const fse = require('fs-extra');
const program = require('commander');

const questions = [
  {
    type: 'input',
    name: 'folderName',
    message: `Enter folder's name ...`
  },
  {
    type: 'input',
    name: 'module',
    message: `Enter module's name ...`
  },
  {
    type: 'input',
    name: 'service',
    message: 'Enter c to create commands service || q to create queries || a to create all ...'
  },
];

clear();
console.log(
  chalk.red(
    figlet.textSync('ddd-cli', { horizontalLayout: 'full' })
  )
);

const createIndexFile = src => fse.createFileSync(src.concat('/index.ts'))
const createModuleFile = (src, name) => fse.createFileSync(src.concat(`/${name}.module.ts`))
const createCommandFolder = (src, name, type) => {
  const createDir = src.concat(`/${type}-${name}`);
  fs.mkdirSync(createDir);
  fse.createFile(createDir.concat(`/${type}-${name}.commands.ts`));
  fse.createFile(createDir.concat(`/${type}-${name}-commands.handler.ts`));
}
const createCasCommandFolder = (src, name) => {
  fse.createFile(src.concat(`/${name}-cas.mapper.ts`));
  fse.createFile(src.concat(`/${name}-cas.repo.ts`));
  fse.createFile(src.concat(`/${name}.cas.ts`));
}

const createAdaptersFolder = (src, name, moduleName) => {
  const adaptersDir = src.concat('/adapters');
  const restDir = adaptersDir.concat('/rests');
  const dtosDir = restDir.concat('/dtos');
  fs.mkdirSync(adaptersDir);
  fs.mkdirSync(restDir);
  fs.mkdirSync(dtosDir);
  createModuleFile(adaptersDir, name.concat('-adapters'))
  createIndexFile(restDir);
  fse.createFile(restDir.concat(`/${name}.rest.ts`));
  if (name.includes('commands')) {
    fse.createFile(dtosDir.concat(`/create-${moduleName}.dto.ts`));
    fse.createFile(dtosDir.concat(`/update-${moduleName}.dto.ts`));
  }
}

const createCoreFolderCommand = (src, name, moduleName) => {
  const coreDir = src.concat('/core');
  const commandsDir = coreDir.concat('/commands');
  const domainsDir = coreDir.concat('/domains');
  fs.mkdirSync(coreDir);
  fs.mkdirSync(commandsDir);
  fs.mkdirSync(domainsDir);
  createModuleFile(coreDir, name.concat('-core'));
  createIndexFile(commandsDir)
  createCommandFolder(commandsDir, moduleName, 'create');
  createCommandFolder(commandsDir, moduleName, 'update');
  fs.mkdirSync(domainsDir.concat('/models'));
  fs.mkdirSync(domainsDir.concat('/repos'));
  fse.createFile(domainsDir.concat(`/repos/${moduleName}.repo.ts`));
}

const createInfraFolderCommand = (src, name, moduleName) => {
  const infraDir = src.concat('/infra');
  const reposDir = infraDir.concat('/repos');
  const cas = reposDir.concat(`/${moduleName}-cas`)
  fs.mkdirSync(infraDir);
  fs.mkdirSync(reposDir);
  fs.mkdirSync(cas);
  createIndexFile(reposDir)
  createModuleFile(infraDir, name.concat('.infra'));
  createIndexFile(cas);
  createCasCommandFolder(`${cas}/`, moduleName);
}

const createModuleFolder = (src, name, moduleName) => {
  createAdaptersFolder(src, name, moduleName)
  name.includes('commands') ? (createCoreFolderCommand(src, name, moduleName), createInfraFolderCommand(src, name, moduleName)) : null;
}

const createModuleService = (ans, src, moduleName) => {
  if (ans === 'c' || ans === 'C' || ans === 'a' || ans === 'A') {
    const folderName = src.concat(`/${moduleName}-commands`)
    fs.mkdirSync(folderName);
    createModuleFolder(folderName, `/${moduleName}-commands`, moduleName)
    createModuleFile(folderName, `/${moduleName}-commands`)
  }
  if (ans === 'q' || ans === 'Q' || ans === 'a' || ans === 'A') {
    const folderName = src.concat(`/${moduleName}-queries`)
    fs.mkdirSync(folderName);
    createModuleFolder(folderName, `/${moduleName}-queries`, moduleName)
    createModuleFile(folderName, `/${moduleName}-queries`)
  }
}

const createFolder = ans => {
  const folderName = process.cwd().concat(`/${ans.folderName}`);
  console.log('>>>>>>>>>>', folderName);
  if (!fs.existsSync(folderName)) {
    const srcDir = folderName.concat('/src');
    const modulesDir = srcDir.concat('/modules');
    fs.mkdirSync(folderName);
    fs.mkdirSync(srcDir);
    fs.mkdirSync(modulesDir);
    fse.copySync(__dirname.concat('/template'), folderName);
    createIndexFile(srcDir);
    createModuleFile(srcDir, ans.module);
    createModuleService(ans.service, modulesDir, ans.module)
  } else {
    console.log(`This folder'name is existed !!!`);
  }
}


program
  .version('1.0.0')
  .description('Create Frame DDD');

program
  .command('Create Module')
  .alias('c')
  .description('Create Package DDD')
  .action(() => {
    prompt(questions).then(answers =>
      createFolder(answers));
  });

program.parse(process.argv);