import { __ } from '@wordpress/i18n';
import {
    useBlockProps,
    BlockControls,
    InspectorControls,
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
import './editor.scss';

const MAP_STYLES = [
    { label: __('Streets', 'onepd-mapbox'), value: 'streets-v12' },
    { label: __('Outdoors', 'onepd-mapbox'), value: 'outdoors-v12' },
    { label: __('Light', 'onepd-mapbox'), value: 'light-v11' },
    { label: __('Dark', 'onepd-mapbox'), value: 'dark-v11' },
    { label: __('Satellite', 'onepd-mapbox'), value: 'satellite-v9' },
    { label: __('Satellite Streets', 'onepd-mapbox'), value: 'satellite-streets-v12' },
];

export default function Edit({ attributes, setAttributes, isSelected, clientId }) {
    // Destructure attributes with default values
    const {
        address = '',
        latitude = 0,
        longitude = 0,
        mapStyle = 'streets-v12',
        zoomLevel = 14,
        orientation = 'horizontal',
        layout = { type: 'flex', orientation: 'horizontal' },
        addressAbbreviation = ''
    } = attributes;

    // Prepare block props with data attributes
    const blockProps = useBlockProps({
        className: [
            'wp-block-onepd-mapbox-location-card',
            layout?.type ? `is-layout-${layout.type}` : '',
            layout?.orientation ? `is-${layout.orientation}` : ''
        ].filter(Boolean).join(' '),
        'data-latitude': latitude,
        'data-longitude': longitude,
        'data-address': address,
        'data-map-style': mapStyle,
        'data-zoom-level': zoomLevel,
        'data-orientation': orientation
    });

    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [map, setMap] = useState(null);
    const mapContainerRef = useRef(null);

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
            }
        } catch (err) {
            setError(__('Error searching locations. Please try again.', 'onepd-mapbox'));
            console.error('Mapbox search error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

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

    // Update map when style or zoom changes
    useEffect(() => {
        if (!map) return;

        map.setStyle(`mapbox://styles/mapbox/${mapStyle}`);
        map.setZoom(zoomLevel);
    }, [map, mapStyle, zoomLevel]);

    // Reinitialize map when orientation changes
    useEffect(() => {
        if (!map || !mapContainerRef.current) return;

        // Trigger a resize to ensure map fits new container
        map.resize();

        // Optionally, you can recenter the map
        if (latitude && longitude) {
            map.setCenter([longitude, latitude]);
        }
    }, [layout?.orientation, map, latitude, longitude]);

    // Initialize or update map when coordinates change
    useEffect(() => {
        if (!latitude || !longitude || !mapContainerRef.current) return;

        const apiKey = window.onePDMapbox?.apiKey;
        if (!apiKey) {
            console.error('Mapbox API key not found');
            return;
        }

        // Initialize map if it doesn't exist
        if (!map) {
            mapboxgl.accessToken = apiKey;
            const newMap = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: `mapbox://styles/mapbox/${mapStyle}`,
                center: [longitude, latitude],
                zoom: zoomLevel,
                trackUserLocation: false
            });

            // Add navigation controls
            newMap.addControl(new mapboxgl.NavigationControl(), 'top-left');

            // Add marker
            new mapboxgl.Marker()
                .setLngLat([longitude, latitude])
                .addTo(newMap);

            setMap(newMap);
        } else {
            // Update existing map
            map.setCenter([longitude, latitude]);
            map.getMarkers?.()?.[0]?.setLngLat([longitude, latitude]);
        }
    }, [latitude, longitude, map, mapStyle, zoomLevel]);

    // Cleanup map on unmount
    useEffect(() => {
        return () => {
            if (map) {
                map.remove();
            }
        };
    }, [map]);

    return (
        <div {...blockProps}>
            <InspectorControls>
                <PanelBody
                    title={__("Map Settings", "onepd-mapbox")}
                    initialOpen={true}
                >
                    <RangeControl
                        label={__("Zoom Level", "onepd-mapbox")}
                        value={zoomLevel}
                        onChange={(value) =>
                            setAttributes({ zoomLevel: value })
                        }
                        min={1}
                        max={20}
                    />
                    <SelectControl
                        label={__("Map Style", "onepd-mapbox")}
                        value={mapStyle}
                        options={MAP_STYLES}
                        onChange={(value) => setAttributes({ mapStyle: value })}
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
                                            onClick={() => handleSelectLocation(suggestion)}
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
                    />
                    <InnerBlocks
                        template={[
                            [
                                "core/group",
                                {
                                    className:
                                        "wp-block-onepd-mapbox-location-card__body",
                                    layout: {
                                        type: "constrained",
                                        justifyContent: "center",
                                        type: "default",
                                        spacing: {
                                            blockGap: "16px",
                                            margin: {
                                                top: "0",
                                                bottom: "0",
                                            },
                                            padding: {
                                                top: "0",
                                                right: "var|preset|spacing|20",
                                                bottom: "var|preset|spacing|20",
                                                left: "var|preset|spacing|20",
                                            },
                                        },
                                    },
                                },
                                [
                                    [
                                        "core/heading",
                                        {
                                            level: 2,
                                            className:
                                                "wp-block-onepd-mapbox-location-card__title",
                                            placeholder: __(
                                                "Location Title",
                                                "onepd-mapbox"
                                            ),
                                        },
                                    ],
                                    [
                                        "core/paragraph",
                                        {
                                            className:
                                                "wp-block-onepd-mapbox-location-card__description",
                                            placeholder: __(
                                                "Location Description",
                                                "onepd-mapbox"
                                            ),
                                        },
                                    ],
                                    [
                                        "core/paragraph",
                                        {
                                            content: `${addressAbbreviation} <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}" target="_blank" rel="noopener noreferrer" class="wp-block-onepd-mapbox-location-card__directions-link">${__('Get Directions', 'onepd-mapbox')}</a>`,
                                            className:
                                                "wp-block-onepd-mapbox-location-card__address",
                                            __experimentalBlockBindings: {
                                                paragraph: {
                                                    source: "core/paragraph",
                                                    path: "content",
                                                },
                                            },
                                        },
                                    ],
                                ],
                            ],
                        ]}
                        templateLock="all"
                    />
                </>
            )}
        </div>
    );
}
