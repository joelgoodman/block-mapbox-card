<?php

namespace OnePD\Mapbox\Blocks\LocationCard;

class Block {
	private $script_handle = 'onepd-mapbox-location-card';
	private $style_handle  = 'onepd-mapbox-location-card-style';

	public function register(): void {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		// Register Mapbox GL scripts and styles
		wp_register_style(
			'mapbox-gl',
			'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css',
			array(),
			'2.15.0'
		);

		wp_register_style(
			'mapbox-gl-geocoder',
			'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css',
			array(),
			'5.0.0'
		);

		$this->register_block_type();
	}

	public function register_block_type(): void {
		// Register block assets
		$this->register_assets();

		// Register the block with WordPress
		register_block_type(
			__DIR__ . '/block.json',
			array(
				'render_callback' => array( $this, 'render_callback' ),
				'editor_script'   => $this->script_handle,
				'editor_style'    => array( $this->style_handle, 'mapbox-gl', 'mapbox-gl-geocoder' ),
				'style'           => array( $this->style_handle, 'mapbox-gl', 'mapbox-gl-geocoder' ),
			)
		);

		// Add Mapbox API key to window object
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	private function register_assets(): void {
		$script_asset_path = ONEPD_MAPBOX_PLUGIN_DIR . 'build/Blocks/LocationCard/index.asset.php';

		// Debug logging
		error_log( 'LocationCard Block: Attempting to register assets' );
		error_log( 'Script asset path: ' . $script_asset_path );

		if ( ! file_exists( $script_asset_path ) ) {
			error_log( 'Script asset file not found: ' . $script_asset_path );
			return;
		}

		try {
			$script_asset = require $script_asset_path;

			// Debug logging
			error_log( 'Script asset loaded successfully' );
			error_log( 'Script dependencies: ' . print_r( $script_asset['dependencies'], true ) );
			error_log( 'Script version: ' . $script_asset['version'] );

			$script_url = plugins_url( 'build/Blocks/LocationCard/index.js', dirname( dirname( __DIR__ ) ) );

			// Debug logging
			error_log( 'Script URL: ' . $script_url );

			wp_register_script(
				$this->script_handle,
				$script_url,
				$script_asset['dependencies'],
				$script_asset['version'],
				true // Load in footer
			);

			// Debug logging
			error_log( 'Script registered with handle: ' . $this->script_handle );

			wp_register_style(
				$this->style_handle,
				plugins_url( 'build/Blocks/LocationCard/style-style-index.css', dirname( dirname( __DIR__ ) ) ),
				array( 'mapbox-gl', 'mapbox-gl-geocoder' ),
				filemtime( ONEPD_MAPBOX_PLUGIN_DIR . 'build/Blocks/LocationCard/style-style-index.css' )
			);

			// Debug logging
			error_log( 'Style registered with handle: ' . $this->style_handle );

		} catch ( Exception $e ) {
			error_log( 'Error registering LocationCard block assets: ' . $e->getMessage() );
		}
	}

	public function enqueue_admin_scripts(): void {
		// Ensure this method runs on both admin and frontend
		$api_key = get_option( 'onepd_mapbox_api_key', '' );

		// Debug logging
		error_log( 'LocationCard Block: Enqueue Admin Scripts' );
		error_log( 'API Key Status: ' . ( empty( $api_key ) ? 'Empty' : 'Present' ) );

		// Always enqueue, even if API key is empty
		wp_enqueue_script( $this->script_handle );

		if ( ! empty( $api_key ) ) {
			// Use wp_add_inline_script to add the API key
			$inline_script = sprintf(
				'window.onePDMapbox = window.onePDMapbox || {}; window.onePDMapbox.apiKey = "%s";',
				esc_js( $api_key )
			);

			wp_add_inline_script(
				$this->script_handle,
				$inline_script,
				'before'
			);

			// Additional debug logging
			error_log( 'LocationCard Block: Inline script added with API key' );
		}
	}

	public function render_callback( $attributes, $content ): string {
		// Conditionally enqueue Mapbox GL JS only when the block is rendered
		wp_enqueue_style( 'mapbox-gl' );
		wp_enqueue_script( 'mapbox-gl' );

		// Enqueue frontend script for map initialization
		wp_enqueue_script(
			'onepd-mapbox-location-card-frontend',
			plugins_url( 'build/Blocks/LocationCard/frontend.js', dirname( dirname( __DIR__ ) ) ),
			array( 'mapbox-gl' ),
			filemtime( ONEPD_MAPBOX_PLUGIN_DIR . 'build/Blocks/LocationCard/frontend.js' ),
			true
		);

		// Get values with defaults
		$latitude = !empty( $attributes['latitude'] ) ? floatval( $attributes['latitude'] ) : 0;
		$longitude = !empty( $attributes['longitude'] ) ? floatval( $attributes['longitude'] ) : 0;
		$address = !empty( $attributes['address'] ) ? esc_attr( $attributes['address'] ) : '';
		$map_style = !empty( $attributes['mapStyle'] ) ? esc_attr( $attributes['mapStyle'] ) : 'streets-v11';
		$zoom_level = !empty( $attributes['zoomLevel'] ) ? intval( $attributes['zoomLevel'] ) : 14;

		// Pass location data to frontend script (maintaining existing API key handling)
		wp_localize_script(
			'onepd-mapbox-location-card-frontend',
			'onePDMapboxLocationData',
			array(
				'latitude' => $latitude,
				'longitude' => $longitude,
				'address' => $address,
				'apiKey' => $this->get_mapbox_api_key()
			)
		);

		// Build the block's HTML with data attributes and accessibility enhancements
		$wrapper_attributes = get_block_wrapper_attributes( array(
			'data-latitude' => $latitude,
			'data-longitude' => $longitude,
			'data-address' => $address,
			'data-map-style' => $map_style,
			'data-zoom-level' => $zoom_level,
			'aria-label' => __('Location Map and Details', 'onepd-mapbox'),
			'role' => 'region'
		) );

		return sprintf(
			'<div %1$s>
                <div class="wp-block-onepd-location-card__content" aria-live="polite">
                    <div 
                        class="wp-block-onepd-location-card__map" 
                        aria-label="%4$s" 
                        role="img" 
                        aria-describedby="location-description">
                    </div>
                    <div class="wp-block-onepd-location-card__body">
                        %2$s
                        <p 
                            id="location-description" 
                            class="wp-block-onepd-location-card__address" 
                            aria-live="polite">
                            %3$s
                        </p>
                    </div>
                </div>
            </div>',
			$wrapper_attributes,
			$content,
			$address,
			__('Interactive map showing location', 'onepd-mapbox')
		);
	}

	private function get_mapbox_api_key(): string {
		// Maintain existing API key retrieval logic
		$api_key = '';

		// Check various sources in order of preference
		if ( defined( 'ONEPD_MAPBOX_API_KEY' ) ) {
			$api_key = ONEPD_MAPBOX_API_KEY;
		} elseif ( function_exists( 'get_option' ) ) {
			$api_key = get_option( 'onepd_mapbox_api_key', '' );
		}

		return $api_key;
	}

	public function __construct() {
		add_action( 'init', array( $this, 'register' ) );
	}
}
