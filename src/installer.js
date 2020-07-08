const simpgit = require('simple-git'),
    git = simpgit(process.cwd()),
    chalk = require('chalk'),
    inquirer = require('inquirer'),
    fs = require('fs'),
    path = require('path'),
    cp = require('child_process'),
    os = require('os');

let log = false,
    npm = "npm";

if(process.argv.includes("--log") || process.argv.includes("-l")) {
    log = true;
}

if(os.platform() === 'win32') npm = "npm.cmd";

require('draftlog').into(console);

if(!fs.existsSync(path.resolve(__dirname, '../logs'))) {
    fs.mkdirSync(path.resolve(__dirname, '../logs'));
}

inquirer.prompt([
    {
        type: 'list',
        name: 'mngtype',
        message: 'What Mangium type do you want to use?',
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

    let logf;
    if(log) {
        logf = fs.createWriteStream(path.resolve(__dirname, '../logs', `${Date.now()}.log`));
        logf.write(`\nType: ${ans.mngtype}\nVersion: ${ans.mngver}\n\n\n------| Clone Phase |-----\n\n`);
    }

    let psts = console.draft(chalk`{green !} {bold Hang on...}`);
    if(ans.mngtype === "Mangium") {

        if(fs.existsSync(path.resolve(process.cwd(), 'mangium'))) {
            psts(chalk`{red !} {bold Directory} {blue ${path.resolve(process.cwd(), 'mangium')}} {bold exists. Waiting for it to be removed...}`);
            if(log) logf.write("Directory mangium in current working directory exists. Waiting for it to be removed.\n");

            let checkint = setInterval(() => {
                if(fs.existsSync(path.resolve(process.cwd(), 'mangium')) === false) {
                    if(log) logf.write("Directory mangium in current working directory has been deleted. Continuing...\n");
                    postcheck();
                    clearInterval(checkint);
                }
            });
        } else postcheck();

        function postcheck() {
            psts(chalk`{green !} {bold Cloning GitHub repository...}`);
            if(log) logf.write("Cloning GitHub repository...\n");

            git.clone("https://github.com/Mangium/mangium.git")
                .then(postclone)
                .catch((e) => {
                    if(log) logf.write("Something went wrong while cloning https://github.com/Mangium/mangium.git\n" +
                        `\n\n-----| Error |-----\n${e}`);
                    psts(chalk`{red !} {bold An error occured while cloning from} {blue https://github.com/Mangium/mangium.git}`);
                    process.exit(1);
                });

        }

        function postclone() {

            psts(chalk`{green !} {bold Installing dependencies...} (this might take a while)`);
            if(log) logf.write("\n\n-----| Dependency Install Phase |-----\nInstalling dependencies (this might take a while)...\n\n   NPM LOG\n");

            let depinstall = cp.spawn(npm, ["install"], {cwd: path.resolve(process.cwd(), 'mangium')});

            if(log) {
                depinstall.stdout.on('data', (message) => {
                    logf.write("   " + message + "\n");
                });
            }

            depinstall.on('close', (code) => {
                if(code === 0) {

                    psts(chalk`{green !} {bold Building webpack...} (this might take a while)`);
                    if(log) logf.write("\n\n-----| Webpack Build Phase |-----\nBuilding webpack... (this might take a while)\n\n   WEBPACK LOG\n");

                    let wpbuild = cp.spawn(npm, ["run", "installerpack"], {cwd: path.resolve(process.cwd(), 'mangium')});

                    if(log) {
                        wpbuild.stdout.on('data', (message) => {
                            logf.write("   " + message + "\n")
                        });
                    }

                    wpbuild.on('close', (code) => {
                        if(code === 0) {
                            psts(chalk`{green ✓} {bold Done!}`)
                            if(log) logf.write("\n\nDone!\nMangium has installed! Run 'npm start' or 'node .' inside Mangium's directory to run it.");
                            console.log(chalk`\n{bold Mangium has installed!}\nRun {blue npm start} or {blue node .} inside Mangium's directory to run it!`);
                            process.exit(0);
                        } else {
                            psts(chalk`{red !} {bold Something went wrong while building mangium. Exiting...`);
                            process.exit(1);
                        }
                    });

                } else {
                    psts(chalk`{red !} {bold Something went wrong while installing dependencies. Exiting...`);
                    process.exit(1);
                }
            });

        }

    } else {
        console.log(chalk`{red !} {bold Mangium subserver is currently not available.}`);
        process.exit(1);
    }
});

