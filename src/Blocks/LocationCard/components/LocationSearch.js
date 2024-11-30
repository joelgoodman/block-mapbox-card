import { __ } from '@wordpress/i18n';
import { 
    BaseControl, 
    TextControl, 
    Button 
} from '@wordpress/components';

// Utility function to retrieve Mapbox API key
const getMapboxApiKey = () => {
    // Prioritize different sources for the API key
    if (window.onePDMapbox && window.onePDMapbox.apiKey) {
        return window.onePDMapbox.apiKey;
    }
    
    if (window.wpApiSettings && window.wpApiSettings.mapboxApiKey) {
        return window.wpApiSettings.mapboxApiKey;
    }
    
    if (window.onepd_mapbox_settings && window.onepd_mapbox_settings.api_key) {
        return window.onepd_mapbox_settings.api_key;
    }
    
    return null;
};

export const LocationSearch = ({ value, onChange }) => {
    const placeName = value?.place_name || '';
    const coordinates = value?.center || [0, 0];

    return (
        <BaseControl 
            label={__('Location', 'onepd-mapbox')}
            help={__('Selected location details', 'onepd-mapbox')}
        >
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextControl
                    value={placeName}
                    placeholder={__('No location selected', 'onepd-mapbox')}
                    disabled
                    style={{ flex: 1, marginRight: '10px' }}
                />
            </div>
        </BaseControl>
    );
};
