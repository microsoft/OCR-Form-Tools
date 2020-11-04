var fs = require('fs');
var child_process = require('child_process');

try {
    const lastCommit = child_process.execSync('git log -1', {encoding: 'utf8'});
    fs.writeFile("src/git-commit-info.txt", lastCommit, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("last commit written to git-commit-info.txt")
        }
    });
} catch (err) {
    console.log("not a git repository");
}