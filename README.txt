=== Mapbox Map Card ===
Contributors: asilentthing
Tags: maps, mapbox, locations, blocks, geocoding
Requires at least: 5.8
Tested up to: 6.7
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Integrate Mapbox functionality into your WordPress site with a custom Location Card block and geocoding capabilities.

== Description ==

Mapbox Map Card brings the power of Mapbox to your WordPress site, allowing you to easily add interactive maps and location-based features to your content.

= Features =

* Custom Location Card Block for displaying map locations
* Mapbox Geocoding integration
* WordPress REST API endpoints for geocoding
* Admin settings page for Mapbox configuration
* Built with modern WordPress development practices
* Schema.org structured data support for enhanced SEO

= Key Capabilities =

* Add interactive maps to your posts and pages
* Geocode addresses and locations
* Customize map appearance and behavior
* Optimized performance with API preconnect
* Full integration with the WordPress block editor
* Generate Schema.org compliant location data

= Technical Features =

* Built with WordPress Blocks API
* Uses Mapbox GL JS v2.15.0
* Includes Mapbox Geocoder integration
* Modern JavaScript build process with webpack
* Composer autoloading for PHP classes

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/block-mapbox-card` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Navigate to Settings > Mapbox to configure your Mapbox API credentials
4. Begin using the Location Card block in your posts and pages

= Requirements =

* WordPress 5.8 or higher
* PHP 7.4 or higher
* Mapbox API access token

== Configuration ==

1. Obtain a Mapbox API token from [Mapbox](https://www.mapbox.com/)
2. Go to Settings > Mapbox in your WordPress admin
3. Enter your Mapbox API token
4. Save your settings

== Usage ==

= Adding a Location Card =

1. Create or edit a post/page
2. Click the '+' button to add a new block
3. Search for "Location Card"
4. Configure the location and map settings in the block sidebar
5. Save your post/page

== Frequently Asked Questions ==

= Do I need a Mapbox account? =

Yes, you need a Mapbox account and API token to use this plugin. You can sign up at mapbox.com.

= Is this plugin compatible with the Block Editor? =

Yes, this plugin is built specifically for the WordPress Block Editor (Gutenberg) and provides custom blocks for map integration.

= Can I customize the map appearance? =

Yes, you can customize various aspects of the map through the block settings in the editor.

== Changelog ==

= 1.0.0 =
* Initial release
* Added Location Card block
* Implemented Mapbox geocoding integration
* Added admin settings page
* Included REST API endpoints

== Upgrade Notice ==

= 1.0.0 =
Initial release of Mapbox Map Card plugin.

== Development ==

This plugin is built using modern WordPress development tools and practices:

= Build Tools =
* WordPress Scripts (@wordpress/scripts)
* Webpack for asset bundling
* Composer for PHP dependencies

= Development Commands =
* `npm run build`: Build production assets
* `npm run start`: Start development environment
* `npm run format`: Format JavaScript code
* `npm run lint:css`: Lint CSS files
* `npm run lint:js`: Lint JavaScript files

= Contributing =
Contributions are welcome! Please feel free to submit a Pull Request.
