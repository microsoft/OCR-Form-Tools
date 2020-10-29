spawn = require('child_process').spawn,
fs = require('fs');

git = spawn('git', ['rev-parse', '--short', 'HEAD']),
buf = Buffer.alloc(0);

git.stdout.on('data', (data) => {
    buf = Buffer.concat([buf, data])
});

git.stderr.on('data', (data) => {
    console.log(data.toString());
});

git.on('close', (code) => {
    fs.writeFile("src/git-commit-info.txt", buf.toString(), (err, data) => {
        if (err) {
            console.log(err);
        }
    });
});