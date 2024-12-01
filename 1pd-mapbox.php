<?php
/**
 * Plugin Name: One Perfect Dish - Mapbox Integration
 * Plugin URI: https://github.com/1perfectdish/1pd-mapbox
 * Description: Mapbox integration for One Perfect Dish
 * Version: 1.0.1
 * Author: One Perfect Dish
 * Author URI: https://oneperfectdish.com
 * License: GPL2
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: onepd-mapbox
 * Domain Path: /languages
 */

namespace OnePD\Mapbox;

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('ONEPD_MAPBOX_VERSION', '1.0.1');
define('ONEPD_MAPBOX_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ONEPD_MAPBOX_PLUGIN_URL', plugin_dir_url(__FILE__));

// Require Composer's autoloader
require_once __DIR__ . '/vendor/autoload.php';

// Initialize plugin components
function init_plugin() {
    // Initialize settings page
    $settings = new Admin\Settings();
    $settings->register();

    // Initialize REST endpoints
    $geocode_endpoint = new REST\GeocodeEndpoint();
    $geocode_endpoint->register();

    // Initialize the LocationCard block
    $block = new Blocks\LocationCard\Block();

    // Add preconnect for Mapbox API
    add_filter('wp_resource_hints', function ($urls, $relation_type) {
        if ($relation_type === 'preconnect') {
            $urls[] = [
                'href' => 'https://api.mapbox.com',
                'crossorigin' => 'anonymous',
            ];
        }
        return $urls;
    }, 10, 2);
}

add_action('plugins_loaded', __NAMESPACE__ . '\\init_plugin');
