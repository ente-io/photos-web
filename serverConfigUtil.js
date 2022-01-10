const cp = require('child_process');

module.exports = {
    getGitSha: () =>
        cp.execSync('git rev-parse --short HEAD', {
            cwd: __dirname,
            encoding: 'utf8',
        }),
};
