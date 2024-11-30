import { __ } from '@wordpress/i18n';
import { registerBlockVariation } from '@wordpress/blocks';

registerBlockVariation('onepd-mapbox/location-card', {
    name: 'row',
    title: __('Row', 'onepd-mapbox'),
    description: __('Displays content side by side.', 'onepd-mapbox'),
    attributes: {
        layout: {
            type: 'flex',
            flexWrap: 'nowrap'
        }
    },
    isDefault: true,
    scope: ['block']
});

registerBlockVariation('onepd-mapbox/location-card', {
    name: 'stack',
    title: __('Stack', 'onepd-mapbox'),
    description: __('Displays content in a stack.', 'onepd-mapbox'),
    attributes: {
        layout: {
            type: 'flex',
            orientation: 'vertical'
        }
    },
    scope: ['block']
});
