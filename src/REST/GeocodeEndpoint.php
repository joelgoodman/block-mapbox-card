<?php

namespace OnePD\Mapbox\REST;

class GeocodeEndpoint {
    const API_NAMESPACE = 'onepd-mapbox/v1';
    const ENDPOINT = '/geocode';

    public function register() {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes() {
        register_rest_route(self::API_NAMESPACE, self::ENDPOINT, [
            'methods' => 'GET',
            'callback' => [$this, 'handleRequest'],
            'permission_callback' => [$this, 'checkPermission'],
            'args' => [
                'address' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    public function checkPermission() {
        return current_user_can('edit_posts');
    }

    public function handleRequest($request) {
        $address = $request->get_param('address');
        $api_key = get_option('onepd_mapbox_api_key');

        if (empty($api_key)) {
            return new \WP_Error(
                'missing_api_key',
                __('Mapbox API key is not configured.', 'onepd-mapbox'),
                ['status' => 400]
            );
        }

        $url = add_query_arg([
            'access_token' => $api_key,
            'limit' => 1,
            'types' => 'address',
        ], 'https://api.mapbox.com/geocoding/v5/mapbox.places/' . urlencode($address) . '.json');

        $response = wp_remote_get($url);

        if (is_wp_error($response)) {
            return new \WP_Error(
                'geocoding_failed',
                $response->get_error_message(),
                ['status' => 500]
            );
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (empty($body['features'])) {
            return new \WP_Error(
                'no_results',
                __('No results found for this address.', 'onepd-mapbox'),
                ['status' => 404]
            );
        }

        $feature = $body['features'][0];
        
        return [
            'address' => $feature['place_name'],
            'latitude' => $feature['center'][1],
            'longitude' => $feature['center'][0],
        ];
    }
}
