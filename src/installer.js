const simpgit = require('simple-git'),
    git = simpgit(process.cwd()),
    chalk = require('chalk'),
    inquirer = require('inquirer'),
    fs = require('fs'),
    path = require('path'),
    cp = require('child_process');

require('draftlog').into(console);

inquirer.prompt([
    {
        type: 'list',
        name: 'mngtype',
        message: 'What Mangium version are you using?',
        choices: [
            "Mangium",
            "Sub server"
        ]
    },
    {
        type: 'list',
        name: 'mngver',
        message: "What version do you want to use?",
        choices: [
            "master"
        ]
    }
]).then((ans) => {
    let psts = console.draft(chalk`{green !} {bold Hang on...}`);
    if(ans.mngtype === "Mangium") {

        if(fs.existsSync(path.resolve(process.cwd(), 'mangium'))) {
            psts(chalk`{red !} {bold Directory} {blue ${path.resolve(process.cwd(), 'mangium')}} {bold exists. Waiting for it to be removed...}`);
            let checkint = setInterval(() => {
                if(fs.existsSync(path.resolve(process.cwd(), 'mangium')) === false) {
                    postcheck();
                    clearInterval(checkint);
                }
            });
        } else postcheck();

        function postcheck() {
            psts(chalk`{green !} {bold Cloning GitHub repository...}`);

            git.clone("https://github.com/Mangium/mangium.git")
                .then(postclone)
                .catch(() => {
                    psts(chalk`{red !} {bold An error occured while cloning from} {blue https://github.com/Mangium/mangium.git}`);
                    process.exit(1);
                });

        }

        function postclone() {

            psts(chalk`{green !} {bold Building webpack...} (this might take a while)`);

            let wpbuild = cp.exec('npm run installerpack', {cwd: path.resolve(process.cwd(), 'mangium')});
            wpbuild.on('close', (code) => {
                if(code === 0) {
                    psts(chalk`{green ✓} {bold Done!}`)
                    console.log(chalk`\n{bold Mangium has installed!}\nRun {blue npm start} or {blue node .} inside Mangium's directory to run it!`);
                    process.exit(0);
                } else {
                    psts(chalk`{red !} {bold Something went wrong while building mangium. Exiting...`);
                    process.exit(1);
                }
            });

        }

    } else {
        console.log(chalk`{red !} {bold Mangium subserver is currently not available.}`);
        process.exit(1);
    }
});

