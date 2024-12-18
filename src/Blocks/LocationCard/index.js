/**
 * WordPress dependencies
 */
import { registerBlockType, registerBlockStyle, unregisterBlockStyle } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps, InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Edit from './edit';
import './editor.scss';
import metadata from './block.json';

// Ensure the global object is set up immediately
window.onePDMapbox = window.onePDMapbox || {};

// Function to retrieve API key from multiple sources
function getMapboxApiKey() {
    // Prioritized sources for API key
    const sources = [
        // First, check if already set in global object
        () => window.onePDMapbox?.apiKey,
        
        // Then check WordPress API settings
        () => window.wpApiSettings?.mapboxApiKey,
        
        // Check WordPress localized settings
        () => window.onepd_mapbox_settings?.api_key,
        
        // Fallback: search for any global object with a Mapbox API key
        () => {
            const mapboxKeys = Object.keys(window).filter(key => 
                key.toLowerCase().includes('mapbox') && 
                typeof window[key] === 'object' && 
                window[key].apiKey
            );
            return mapboxKeys.length > 0 ? window[mapboxKeys[0]].apiKey : null;
        }
    ];

    for (const source of sources) {
        const apiKey = source();
        if (apiKey) {
            // Ensure the key is set in the global object
            window.onePDMapbox.apiKey = apiKey;
            return apiKey;
        }
    }

    return null;
}

// Attempt to retrieve API key immediately
const apiKey = getMapboxApiKey();

// Debugging and utility methods
window.onePDMapboxDebug = {
    getApiKey: () => {
        return getMapboxApiKey();
    },
    setApiKey: (key) => {
        window.onePDMapbox = window.onePDMapbox || {};
        window.onePDMapbox.apiKey = key;
    },
    // Method to force API key retrieval
    forceApiKeyRetrieval: () => {
        return getMapboxApiKey();
    }
};

// If no API key is found, log a warning
if (!apiKey) {
    // No Mapbox API Key could be retrieved. Location search will not work.
}

// Register block
registerBlockType(metadata.name, {
    edit: Edit,
    save: ({ attributes }) => {
        const { address, latitude, longitude, mapStyle, zoomLevel } = attributes;

        const blockProps = useBlockProps.save({
            className: 'wp-block-onepd-mapbox-location-card',
            'data-latitude': latitude,
            'data-longitude': longitude,
            'data-address': address,
            'data-map-style': mapStyle,
            'data-zoom-level': zoomLevel
        });

        const innerBlocksProps = useInnerBlocksProps.save({
            className: 'wp-block-onepd-mapbox-location-card__content'
        });

        return (
            <div {...blockProps}>
                <div className="wp-block-onepd-mapbox-location-card__map" />
                <div {...innerBlocksProps} />
            </div>
        );
    },
    attributes: {
        ...metadata.attributes,
        mapboxApiKey: {
            type: 'string',
            default: apiKey || ''
        }
    }
});

// Register block styles
unregisterBlockStyle(metadata.name, 'default');
registerBlockStyle(metadata.name, {
    name: 'stacked',
    label: __('Stacked', 'onepd-mapbox'),
    isDefault: true
});
registerBlockStyle(metadata.name, {
    name: 'row',
    label: __('Row', 'onepd-mapbox')
});
