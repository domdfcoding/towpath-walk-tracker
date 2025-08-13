// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

module.exports = {
	entry: './src/leaflet_bundle.ts',
	module: {
		rules: [
			{
				use: 'ts-loader',
				exclude: /node_modules/
			}
		]
	},
	output: {
		filename: 'leaflet_bundle.js',
		path: path.resolve(__dirname, 'towpath_walk_tracker', 'static', 'js'),
		clean: false
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	devtool: 'source-map',
};
