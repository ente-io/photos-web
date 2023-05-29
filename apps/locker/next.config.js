/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    webpack: (config) => {
        // Fixes npm packages that depend on `fs` module
        config.resolve.fallback = { fs: false, path: false };
        // load worker files as a urls by using Asset Modules
        // https://webpack.js.org/guides/asset-modules/
        config.module.rules.unshift({
            test: /pdf\.worker\.(min\.)?js/,
            type: 'asset/resource',
            generator: {
                filename: 'static/worker/[hash][ext][query]',
            },
        });

        return config;
    },
    appDir: false,
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
