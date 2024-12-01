import { __ } from '@wordpress/i18n';
import {
    useBlockProps,
    BlockControls,
    InspectorControls,
    useInnerBlocksProps,
    InnerBlocks
} from '@wordpress/block-editor';
import {
    ToolbarGroup,
    ToolbarButton,
    Placeholder,
    Button,
    Modal,
    TextControl,
    Spinner,
    Notice,
    PanelBody,
    SelectControl,
    RangeControl,
    ToggleControl
} from '@wordpress/components';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { edit as editIcon, mapMarker as pinIcon, close as closeIcon } from '@wordpress/icons';
import mapboxgl from 'mapbox-gl';
import { select, dispatch } from '@wordpress/data';
import './editor.scss';

const MAP_STYLES = [
    { label: __('Streets', 'onepd-mapbox'), value: 'streets-v12' },
    { label: __('Outdoors', 'onepd-mapbox'), value: 'outdoors-v12' },
    { label: __('Light', 'onepd-mapbox'), value: 'light-v11' },
    { label: __('Dark', 'onepd-mapbox'), value: 'dark-v11' },
    { label: __('Satellite', 'onepd-mapbox'), value: 'satellite-v9' },
    { label: __('Satellite Streets', 'onepd-mapbox'), value: 'satellite-streets-v12' },
];

export default function Edit({ attributes, setAttributes, isSelected, clientId, className }) {
    const {
        address = '',
        addressAbbreviation = '',
        latitude,
        longitude,
        mapStyle = 'streets-v12',
        zoomLevel = 12,
        schemaType = 'Place',
        schemaName = '',
        schemaDescription = '',
        schemaOpeningHours = '',
        schemaTelephone = '',
        schemaWebsite = ''
    } = attributes;

    const [map, setMap] = useState(null);
    const [mapMarker, setMapMarker] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const mapContainerRef = useRef(null);

    // Handle style changes by reinitializing map
    useEffect(() => {
        const cleanupMap = () => {
            try {
                if (mapMarker) {
                    mapMarker.remove();
                    setMapMarker(null);
                }
                if (map && map.remove) {
                    map.remove();
                    setMap(null);
                }
            } catch (error) {
                // Removed console.error statement
            }
        };

        if (!mapContainerRef.current || !window.onePDMapbox?.apiKey) {
            return;
        }

        cleanupMap();

        mapboxgl.accessToken = window.onePDMapbox.apiKey;

        // Use saved coordinates if they exist
        const hasCoordinates = latitude && longitude;
        const center = hasCoordinates ? [longitude, latitude] : [-122.4194, 37.7749];
        const currentZoom = zoomLevel ? parseFloat(zoomLevel) : 12;

        const newMap = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: `mapbox://styles/mapbox/${mapStyle}`,
            center: center,
            zoom: currentZoom,
            interactive: true,
            preserveDrawingBuffer: true
        });

        let currentMarker = null;

        // Wait for map to load before adding controls and marker
        newMap.on('load', () => {
            if (!mapContainerRef.current) return;

            // Add navigation control
            newMap.addControl(new mapboxgl.NavigationControl());

            // Add marker only if we have saved coordinates
            if (hasCoordinates) {
                currentMarker = new mapboxgl.Marker()
                    .setLngLat([longitude, latitude])
                    .addTo(newMap);
                setMapMarker(currentMarker);
            }

            // Listen for zoom changes
            newMap.on('zoomend', () => {
                if (!mapContainerRef.current) return;
                setAttributes({ zoomLevel: newMap.getZoom() });
            });

            // Force a resize to ensure the map fits its container
            newMap.resize();
        });

        // Handle container size changes
        const resizeObserver = new ResizeObserver(() => {
            if (newMap && !newMap._removed) {
                newMap.resize();
            }
        });

        if (mapContainerRef.current) {
            resizeObserver.observe(mapContainerRef.current);
            // A11y: Add aria-label and role to map container
            mapContainerRef.current.setAttribute('aria-label', __('Interactive Location Map', 'onepd-mapbox'));
            mapContainerRef.current.setAttribute('role', 'region');
        }

        setMap(newMap);

        // Cleanup function
        return () => {
            try {
                resizeObserver.disconnect();
                if (currentMarker) {
                    currentMarker.remove();
                }
                if (newMap && newMap.remove && !newMap._removed) {
                    newMap.remove();
                }
            } catch (error) {
                // Removed console.error statement
            }
        };
    }, [mapStyle, latitude, longitude, zoomLevel, className]);

    // State for error handling
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // A11y: Error handling with screen reader-friendly messages
    useEffect(() => {
        if (error) {
            const errorContainer = document.createElement('div');
            errorContainer.setAttribute('aria-live', 'polite');
            errorContainer.setAttribute('role', 'alert');
            errorContainer.textContent = error;
            document.body.appendChild(errorContainer);
            
            return () => {
                document.body.removeChild(errorContainer);
            };
        }
    }, [error]);

    // Perform Mapbox search
    const performSearch = useCallback(async (query) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const apiKey = window.onePDMapbox?.apiKey || '';
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
                new URLSearchParams({
                    access_token: apiKey,
                    types: 'address,place,poi,locality,neighborhood,postcode',
                    limit: '10',
                    language: 'en'
                })
            );

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const sortedFeatures = data.features.sort((a, b) => {
                    const typeOrder = ['address', 'poi', 'place', 'locality', 'neighborhood', 'postcode'];
                    return typeOrder.indexOf(a.place_type[0]) - typeOrder.indexOf(b.place_type[0]);
                });

                setSuggestions(sortedFeatures);
            } else {
                setSuggestions([]);
                setError(__('No locations found. Please try a different search.', 'onepd-mapbox'));
            }
        } catch (err) {
            setError(__('Error searching locations. Please try again.', 'onepd-mapbox'));
            // Removed console.error statement
        } finally {
            setIsLoading(false);
        }
    }, []);

    // A11y: Keyboard navigation for location search
    const handleKeyboardSearch = (event) => {
        if (event.key === 'Enter') {
            performSearch(event.target.value);
        }
    };

    const handleSelectLocation = useCallback((suggestion) => {
        setAttributes({
            address: suggestion.place_name,
            latitude: suggestion.center[1],
            longitude: suggestion.center[0]
        });
        setIsSearching(false);
    }, [setAttributes]);

    const clearLocation = useCallback(() => {
        setAttributes({
            address: '',
            latitude: 0,
            longitude: 0
        });
    }, [setAttributes]);

    const toggleLocationSearch = useCallback(() => {
        setIsSearching(prev => !prev);
        setSearchQuery('');
        setSuggestions([]);
    }, []);

    // Comprehensive abbreviation dictionaries
    const ABBREVIATIONS = {
        // State abbreviations
        states: {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
            'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
            'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
            'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
            'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
            'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
            'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
            'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
            'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
            'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
            'Wisconsin': 'WI', 'Wyoming': 'WY'
        },

        // Directional abbreviations
        directions: {
            'North': 'N', 'South': 'S', 'East': 'E', 'West': 'W',
            'Northeast': 'NE', 'Northwest': 'NW', 'Southeast': 'SE', 'Southwest': 'SW'
        },

        // Road type abbreviations
        roadTypes: {
            'Street': 'St', 'Road': 'Rd', 'Avenue': 'Ave', 'Boulevard': 'Blvd',
            'Drive': 'Dr', 'Lane': 'Ln', 'Court': 'Ct', 'Place': 'Pl',
            'Highway': 'Hwy', 'Parkway': 'Pkwy', 'Square': 'Sq'
        },

        // Country abbreviations (ISO 3166-1 alpha-2 codes)
        countries: {
            'United States': 'US', 'United States of America': 'USA',
            'Canada': 'CA', 'Mexico': 'MX',
            'United Kingdom': 'UK', 'Great Britain': 'GB',
            'France': 'FR', 'Germany': 'DE', 'Italy': 'IT', 'Spain': 'ES',
            'Japan': 'JP', 'China': 'CN', 'India': 'IN', 'Brazil': 'BR',
            'Australia': 'AU', 'New Zealand': 'NZ',
            'Russia': 'RU', 'South Africa': 'ZA',
            'Argentina': 'AR', 'South Korea': 'KR', 'Israel': 'IL',
            'Netherlands': 'NL', 'Belgium': 'BE', 'Switzerland': 'CH',
            'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI',
            'Ireland': 'IE', 'Portugal': 'PT', 'Greece': 'GR',
            'Poland': 'PL', 'Czech Republic': 'CZ', 'Austria': 'AT',
            'Singapore': 'SG', 'United Arab Emirates': 'AE',
            'Saudi Arabia': 'SA', 'Turkey': 'TR', 'Egypt': 'EG',
            'Malaysia': 'MY', 'Indonesia': 'ID', 'Thailand': 'TH',
            'Philippines': 'PH', 'Vietnam': 'VN'
        }
    };

    // Function to abbreviate a single word
    const abbreviateWord = (word) => {
        // Check state abbreviations
        if (ABBREVIATIONS.states[word]) return ABBREVIATIONS.states[word];

        // Check directional abbreviations
        if (ABBREVIATIONS.directions[word]) return ABBREVIATIONS.directions[word];

        // Check road type abbreviations
        if (ABBREVIATIONS.roadTypes[word]) return ABBREVIATIONS.roadTypes[word];

        // Check country abbreviations
        if (ABBREVIATIONS.countries[word]) return ABBREVIATIONS.countries[word];

        // Default: return the whole word
        return word;
    };

    // Function to generate address abbreviation
    const generateAddressAbbreviation = useCallback((fullAddress) => {
        if (!fullAddress) return '';

        // Split the address into parts
        const parts = fullAddress.split(',').map(part => part.trim());

        // If only one part, return abbreviated version
        if (parts.length === 1) {
            return parts[0]
                .split(' ')
                .map(word => abbreviateWord(word))
                .join(' ')
                .substring(0, 30) + (parts[0].length > 30 ? '...' : '');
        }

        // For multiple parts, create an abbreviated version
        const abbreviatedParts = parts.map((part, index) => {
            // Keep first part (street address) more detailed
            if (index === 0) {
                return part
                    .split(' ')
                    .map(word => abbreviateWord(word))
                    .join(' ')
                    .substring(0, 30) + (part.length > 30 ? '...' : '');
            }

            // Abbreviate subsequent parts (city, state, etc.)
            return part
                .split(' ')
                .map(word => abbreviateWord(word))
                .join(' ')
                .substring(0, 20);
        });

        return abbreviatedParts.join(', ');
    }, []);

    // Update addressAbbreviation when address changes
    useEffect(() => {
        const abbreviation = generateAddressAbbreviation(address);
        if (abbreviation !== attributes.addressAbbreviation) {
            setAttributes({ addressAbbreviation: abbreviation });
        }
    }, [address, generateAddressAbbreviation, setAttributes]);

    // Update address block binding when address changes
    useEffect(() => {
        if (!clientId) return;

        const innerBlocks = select('core/block-editor').getBlocks(clientId);
        const groupBlock = innerBlocks.find(block => block.name === 'core/group');

        if (groupBlock) {
            // Update address text
            const addressBlock = groupBlock.innerBlocks.find(block =>
                block.attributes.className?.includes('wp-block-onepd-mapbox-location-card__address')
            );

            if (addressBlock) {
                dispatch('core/block-editor').updateBlockAttributes(addressBlock.clientId, {
                    content: addressAbbreviation
                });
            }

            // Update Get Directions button URL
            const buttonBlock = groupBlock.innerBlocks.find(block =>
                block.name === 'core/button'
            );

            if (buttonBlock) {
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                dispatch('core/block-editor').updateBlockAttributes(buttonBlock.clientId, {
                    url: directionsUrl
                });
            }
        }
    }, [address, addressAbbreviation, clientId]);

    // Handle address selection
    const handleAddressSelect = useCallback((place) => {
        if (!place?.center) return;

        setAttributes({
            latitude: place.center[1],
            longitude: place.center[0],
            address: place.place_name,
            addressAbbreviation: generateAddressAbbreviation(place.place_name)
        });
        setIsSearching(false);
    }, [setAttributes, generateAddressAbbreviation]);

    useEffect(() => {
        if (!clientId) return;

        const innerBlocks = select('core/block-editor').getBlocks(clientId);
        const groupBlock = innerBlocks.find(block => block.name === 'core/group');

        if (groupBlock) {
            // Update address text
            const addressBlock = groupBlock.innerBlocks.find(block =>
                block.attributes.className?.includes('wp-block-onepd-mapbox-location-card__address')
            );

            if (addressBlock) {
                dispatch('core/block-editor').updateBlockAttributes(addressBlock.clientId, {
                    content: addressAbbreviation
                });
            }

            // Update Get Directions button URL
            const buttonBlock = groupBlock.innerBlocks.find(block =>
                block.name === 'core/button'
            );

            if (buttonBlock) {
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
                dispatch('core/block-editor').updateBlockAttributes(buttonBlock.clientId, {
                    url: directionsUrl
                });
            }
        }
    }, [address, addressAbbreviation, clientId]);

    const BLOCKS_TEMPLATE = [
        ['core/group', {
            className: 'wp-block-onepd-mapbox-location-card__body',
            templateLock: false // Allow editing of inner blocks
        }, [
            ['core/heading', {
                level: 2,
                className: 'wp-block-onepd-mapbox-location-card__title',
                placeholder: __('Location Title', 'onepd-mapbox')
            }],
            ['core/paragraph', {
                className: 'wp-block-onepd-mapbox-location-card__description',
                placeholder: __('Location Description', 'onepd-mapbox')
            }],
            ['core/paragraph', {
                className: 'wp-block-onepd-mapbox-location-card__address',
                content: addressAbbreviation
            }],
            ['core/button', {
                className: 'wp-block-onepd-mapbox-location-card__directions',
                text: __('Get Directions', 'onepd-mapbox'),
                url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
                target: '_blank',
                rel: 'noopener noreferrer'
            }]
        ]]
    ];

    const blockProps = useBlockProps({
        className: `${className} ${isSelected ? 'is-selected' : ''}`
    });

    const innerBlocksProps = useInnerBlocksProps(
        { className: 'wp-block-onepd-mapbox-location-card__content' },
        { template: BLOCKS_TEMPLATE, templateLock: 'insert' }
    );

    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div {...blockProps}>
            <InspectorControls>
                <PanelBody 
                    title={__('Map Style', 'onepd-mapbox')}
                    initialOpen={true}
                >
                    <SelectControl
                        label={__('Map Style', 'onepd-mapbox')}
                        value={mapStyle}
                        options={MAP_STYLES}
                        onChange={(newMapStyle) => setAttributes({ mapStyle: newMapStyle })}
                    />
                    <RangeControl
                        label={__('Zoom Level', 'onepd-mapbox')}
                        value={zoomLevel}
                        onChange={(newZoomLevel) => setAttributes({ zoomLevel: newZoomLevel })}
                        min={1}
                        max={20}
                    />
                </PanelBody>

                <PanelBody 
                    title={__('Schema.org Settings', 'onepd-mapbox')}
                    initialOpen={false}
                >
                    <SelectControl
                        label={__('Schema Type', 'onepd-mapbox')}
                        value={schemaType}
                        options={[
                            { label: 'Place', value: 'Place' },
                            { label: 'Local Business', value: 'LocalBusiness' },
                            { label: 'Restaurant', value: 'Restaurant' },
                            { label: 'Hotel', value: 'Hotel' },
                            { label: 'Tourist Attraction', value: 'TouristAttraction' },
                            { label: 'Organization', value: 'Organization' }
                        ]}
                        onChange={(newSchemaType) => setAttributes({ schemaType: newSchemaType })}
                    />
                    <TextControl
                        label={__('Name', 'onepd-mapbox')}
                        value={schemaName}
                        onChange={(newSchemaName) => setAttributes({ schemaName: newSchemaName })}
                        help={__('Optional name for the location in Schema.org markup', 'onepd-mapbox')}
                    />
                    <TextControl
                        label={__('Description', 'onepd-mapbox')}
                        value={schemaDescription}
                        onChange={(newSchemaDescription) => setAttributes({ schemaDescription: newSchemaDescription })}
                        help={__('Optional description for the location', 'onepd-mapbox')}
                    />
                    <TextControl
                        label={__('Telephone', 'onepd-mapbox')}
                        value={schemaTelephone}
                        onChange={(newSchemaTelephone) => setAttributes({ schemaTelephone: newSchemaTelephone })}
                        help={__('Contact telephone number', 'onepd-mapbox')}
                    />
                    <TextControl
                        label={__('Website', 'onepd-mapbox')}
                        value={schemaWebsite}
                        onChange={(newSchemaWebsite) => setAttributes({ schemaWebsite: newSchemaWebsite })}
                        help={__('Official website URL', 'onepd-mapbox')}
                    />
                    <TextControl
                        label={__('Opening Hours', 'onepd-mapbox')}
                        value={schemaOpeningHours}
                        onChange={(newSchemaOpeningHours) => setAttributes({ schemaOpeningHours: newSchemaOpeningHours })}
                        help={__('Specify opening hours (e.g., Monday-Friday)', 'onepd-mapbox')}
                    />
                </PanelBody>
            </InspectorControls>

            <BlockControls>
                <ToolbarGroup>
                    {address ? (
                        <>
                            <ToolbarButton
                                icon={editIcon}
                                label={__("Edit Location", "onepd-mapbox")}
                                onClick={toggleLocationSearch}
                            />
                            <ToolbarButton
                                icon={closeIcon}
                                label={__("Clear Location", "onepd-mapbox")}
                                onClick={clearLocation}
                            />
                        </>
                    ) : (
                        <ToolbarButton
                            icon={pinIcon}
                            label={__("Add Location", "onepd-mapbox")}
                            onClick={toggleLocationSearch}
                        />
                    )}
                </ToolbarGroup>
            </BlockControls>

            {isSearching && (
                <Modal
                    title={__('Search Location', 'onepd-mapbox')}
                    onRequestClose={toggleLocationSearch}
                >
                    <div className="wp-block-onepd-mapbox-location-card__search-modal">
                        <TextControl
                            label={__('Enter Location', 'onepd-mapbox')}
                            value={searchQuery}
                            onChange={(value) => {
                                setSearchQuery(value);
                                performSearch(value);
                            }}
                            onKeyDown={handleKeyboardSearch}
                            placeholder={__('Street address, city, or landmark', 'onepd-mapbox')}
                        />

                        <div className="wp-block-onepd-mapbox-location-card__search-results">
                            {isLoading && <Spinner />}

                            {error && (
                                <Notice
                                    status="error"
                                    isDismissible={false}
                                >
                                    {error}
                                </Notice>
                            )}

                            <div className="wp-block-onepd-mapbox-location-card__suggestions">
                                {suggestions.length > 0 ? (
                                    suggestions.map((suggestion, index) => (
                                        <Button
                                            key={suggestion.id}
                                            onClick={() => handleAddressSelect(suggestion)}
                                            className="wp-block-onepd-mapbox-location-card__suggestion-item"
                                        >
                                            {suggestion.place_name}
                                        </Button>
                                    ))
                                ) : (
                                    <p className="wp-block-onepd-mapbox-location-card__no-results">
                                        {searchQuery.length >= 3
                                            ? __('No locations found', 'onepd-mapbox')
                                            : __('Search for an address', 'onepd-mapbox')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {!address && (
                <Placeholder
                    icon={pinIcon}
                    label={__("Location Card", "onepd-mapbox")}
                    instructions={__(
                        "Add a location to get started",
                        "onepd-mapbox"
                    )}
                >
                    <Button variant="primary" onClick={toggleLocationSearch}>
                        {__("Search Location", "onepd-mapbox")}
                    </Button>
                </Placeholder>
            )}

            {address && (
                <>
                    <div 
                        ref={mapContainerRef} 
                        className="wp-block-onepd-mapbox-location-card__map" 
                        style={{ minHeight: '300px' }}
                    />
                    <div {...innerBlocksProps} />
                </>
            )}
        </div>
    );
}
