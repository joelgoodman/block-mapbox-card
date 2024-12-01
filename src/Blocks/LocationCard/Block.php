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

		wp_register_script(
			'mapbox-gl',
			'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js',
			array(),
			'2.15.0',
			true
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

		if ( ! file_exists( $script_asset_path ) ) {
			return;
		}

		try {
			$script_asset = require $script_asset_path;

			$script_url = plugins_url( 'build/Blocks/LocationCard/index.js', dirname( dirname( __DIR__ ) ) );

			wp_register_script(
				$this->script_handle,
				$script_url,
				$script_asset['dependencies'],
				$script_asset['version'],
				true // Load in footer
			);

			wp_register_style(
				$this->style_handle,
				plugins_url( 'build/Blocks/LocationCard/style-style-index.css', dirname( dirname( __DIR__ ) ) ),
				array( 'mapbox-gl', 'mapbox-gl-geocoder' ),
				filemtime( ONEPD_MAPBOX_PLUGIN_DIR . 'build/Blocks/LocationCard/style-style-index.css' )
			);

		} catch ( Exception $e ) {
			return;
		}
	}

	public function enqueue_admin_scripts(): void {
		$api_key = get_option( 'onepd_mapbox_api_key', '' );

		wp_enqueue_script( $this->script_handle );

		if ( ! empty( $api_key ) ) {
			$inline_script = sprintf(
				'window.onePDMapbox = window.onePDMapbox || {}; window.onePDMapbox.apiKey = "%s";',
				esc_js( $api_key )
			);

			wp_add_inline_script(
				$this->script_handle,
				$inline_script,
				'before'
			);
		}
	}

	public function render_callback( $attributes, $content ): string {
		wp_enqueue_style( 'mapbox-gl' );
		wp_enqueue_script( 'mapbox-gl' );

		wp_enqueue_script(
			'onepd-mapbox-location-card-frontend',
			plugins_url( 'build/Blocks/LocationCard/frontend.js', dirname( dirname( __DIR__ ) ) ),
			array( 'mapbox-gl' ),
			filemtime( ONEPD_MAPBOX_PLUGIN_DIR . 'build/Blocks/LocationCard/frontend.js' ),
			true
		);

		$latitude = !empty( $attributes['latitude'] ) ? floatval( $attributes['latitude'] ) : 0;
		$longitude = !empty( $attributes['longitude'] ) ? floatval( $attributes['longitude'] ) : 0;
		$address = !empty( $attributes['address'] ) ? esc_attr( $attributes['address'] ) : '';
		$map_style = !empty( $attributes['mapStyle'] ) ? esc_attr( $attributes['mapStyle'] ) : 'streets-v11';
		$zoom_level = !empty( $attributes['zoomLevel'] ) ? intval( $attributes['zoomLevel'] ) : 14;

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

		$wrapper_attributes = get_block_wrapper_attributes( array(
			'data-latitude' => $latitude,
			'data-longitude' => $longitude,
			'data-address' => $address,
			'data-map-style' => $map_style,
			'data-zoom-level' => $zoom_level,
			'aria-label' => __('Location Map and Details', 'onepd-mapbox'),
			'role' => 'region'
		) );

		$map_div_attributes = ' aria-label="' . esc_attr__('Interactive map showing location', 'onepd-mapbox') . '" role="img" aria-describedby="location-description"';
		$content = str_replace(
			'<div class="wp-block-onepd-mapbox-location-card__map">',
			'<div class="wp-block-onepd-mapbox-location-card__map"' . $map_div_attributes . '>',
			$content
		);

		$content = str_replace(
			'<p class="wp-block-onepd-location-card__address">',
			'<p class="wp-block-onepd-location-card__address" id="location-description" aria-live="polite">',
			$content
		);

		return $content;
	}

	private function get_mapbox_api_key(): string {
		$api_key = '';

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
