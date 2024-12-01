const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        'Blocks/LocationCard/index': './src/Blocks/LocationCard/index.js',
        'Blocks/LocationCard/style-index': './src/Blocks/LocationCard/style.scss',
        'Blocks/LocationCard/frontend': './src/Blocks/LocationCard/frontend.js',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    }
};
