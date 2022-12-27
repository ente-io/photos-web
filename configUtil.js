const cp = require('child_process');
const { getIsSentryEnabled } = require('./sentryConfigUtil');

module.exports = {
    COOP_COEP_HEADERS: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
    },

    WEB_SECURITY_HEADERS: {
        'Strict-Transport-Security': '  max-age=63072000',
        'X-Content-Type-Options': 'nosniff',
        'X-Download-Options': 'noopen',
        'X-Frame-Options': 'deny',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'same-origin',
    },

    CSP_DIRECTIVES: {
        // self is safe enough
        'default-src': "'self'",
        // data to allow two factor qr code
        'img-src': "'self' blob: data:",
        'media-src': "'self' blob:",
        'manifest-src': "'self'",
        'style-src': "'self' 'unsafe-inline'",
        'font-src ': "'self'; script-src 'self' 'unsafe-eval' blob:",
        'connect-src':
            "'self' https://*.ente.io http://localhost:8080 data: blob: https://ente-prod-eu.s3.eu-central-003.backblazeb2.com ",
        'base-uri ': "'self'",
        // to allow worker
        'child-src': "'self' blob:",
        'object-src': "'none'",
        'frame-ancestors': " 'none'",
        'form-action': "'none'",
        'report-uri': ' https://csp-reporter.ente.io/local',
        'report-to': ' https://csp-reporter.ente.io/local',
    },

    ALL_ROUTES: '/(.*)',

    buildCSPHeader: (directives) => ({
        'Content-Security-Policy-Report-Only': Object.entries(
            directives
        ).reduce((acc, [key, value]) => acc + `${key} ${value};`, ''),
    }),

    convertToNextHeaderFormat: (headers) =>
        Object.entries(headers).map(([key, value]) => ({ key, value })),

    getGitSha: () =>
        cp.execSync('git rev-parse --short HEAD', {
            cwd: __dirname,
            encoding: 'utf8',
        }),
    getIsSentryEnabled: getIsSentryEnabled,
};
