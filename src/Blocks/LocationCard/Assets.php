<?php

namespace OnePD\Mapbox\Blocks\LocationCard;

class Assets {
    public function register() {
        add_action('enqueue_block_editor_assets', [$this, 'localizeEditorScript']);
    }

    public function localizeEditorScript() {
        wp_localize_script('onepd-mapbox-location-card-editor', 'onePDMapbox', [
            'apiKey' => get_option('onepd_mapbox_api_key'),
            'mapStyle' => get_option('onepd_mapbox_style'),
            'defaultLat' => get_option('onepd_mapbox_default_lat'),
            'defaultLng' => get_option('onepd_mapbox_default_lng'),
            'defaultZoom' => get_option('onepd_mapbox_default_zoom', 12),
            'language' => get_locale(),
            'i18n' => [
                'errorSearching' => __('Error searching location. Please try again.', 'onepd-mapbox'),
            ],
        ]);
    }
}
