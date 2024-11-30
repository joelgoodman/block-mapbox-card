<?php

namespace OnePD\Mapbox\Admin;

class Settings {
    const OPTION_GROUP = 'onepd_mapbox_options';
    const OPTION_NAME = 'onepd_mapbox_api_key';
    const SETTINGS_PAGE = 'onepd-mapbox-settings';

    public function register() {
        add_action('admin_menu', [$this, 'addSettingsPage']);
        add_action('admin_init', [$this, 'registerSettings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAssets']);
    }

    public function enqueueAssets($hook) {
        if ($hook !== 'settings_page_' . self::SETTINGS_PAGE) {
            return;
        }

        // Add inline styles
        wp_add_inline_style('admin-bar', '
            .onepd-mapbox-api-key-wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 650px;
            }
            .onepd-mapbox-api-key-input-group {
                position: relative;
                width: 100%;
            }
            .onepd-mapbox-api-key-input-group input {
                width: 100%;
                padding-right: 40px;
            }
            .onepd-mapbox-api-key-toggle {
                position: absolute;
                right: 2px;
                top: 50%;
                transform: translateY(-50%);
                cursor: pointer;
                padding: 4px 8px;
                background: none;
                border: none;
                color: #2271b1;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .onepd-mapbox-api-key-toggle:hover {
                color: #135e96;
            }
            .onepd-mapbox-api-key-toggle:focus {
                outline: 1px solid #2271b1;
                box-shadow: none;
            }
            .onepd-mapbox-api-key-wrapper .description {
                margin: 0;
                color: #646970;
            }
            .onepd-mapbox-api-key-wrapper .description a {
                margin-left: 4px;
                text-decoration: none;
            }
            .onepd-mapbox-api-key-wrapper .description a:hover {
                text-decoration: underline;
            }
            .onepd-mapbox-api-key-wrapper .dashicons-external {
                font-size: 16px;
                width: 16px;
                height: 16px;
                vertical-align: text-bottom;
                margin-left: 2px;
            }
        ');

        // Add inline script
        wp_add_inline_script('admin-bar', '
            document.addEventListener("DOMContentLoaded", function() {
                const wrapper = document.querySelector(".onepd-mapbox-api-key-wrapper");
                const input = wrapper.querySelector("input");
                const toggle = wrapper.querySelector("button");
                
                toggle.addEventListener("click", function() {
                    const type = input.type === "password" ? "text" : "password";
                    input.type = type;
                    toggle.setAttribute("aria-label", 
                        type === "password" ? "Show API key" : "Hide API key"
                    );
                    toggle.innerHTML = type === "password" ? 
                        `<span class="dashicons dashicons-visibility"></span>` :
                        `<span class="dashicons dashicons-hidden"></span>`;
                });
            });
        ');
    }

    public function addSettingsPage() {
        add_options_page(
            __('Mapbox Settings', 'onepd-mapbox'),
            __('Mapbox', 'onepd-mapbox'),
            'manage_options',
            self::SETTINGS_PAGE,
            [$this, 'renderSettingsPage']
        );
    }

    public function registerSettings() {
        register_setting(
            self::OPTION_GROUP,
            self::OPTION_NAME,
            [
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'default' => ''
            ]
        );

        add_settings_section(
            'onepd_mapbox_main',
            __('API Configuration', 'onepd-mapbox'),
            [$this, 'renderSettingsSection'],
            self::SETTINGS_PAGE
        );

        add_settings_field(
            'onepd_mapbox_api_key',
            __('Mapbox API Key', 'onepd-mapbox'),
            [$this, 'renderApiKeyField'],
            self::SETTINGS_PAGE,
            'onepd_mapbox_main'
        );
    }

    public function renderSettingsPage() {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields(self::OPTION_GROUP);
                do_settings_sections(self::SETTINGS_PAGE);
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    public function renderSettingsSection() {
        echo '<p>' . esc_html__('Enter your Mapbox API key to enable map functionality.', 'onepd-mapbox') . '</p>';
    }

    public function renderApiKeyField() {
        $value = get_option(self::OPTION_NAME);
        ?>
        <div class="onepd-mapbox-api-key-wrapper">
            <div class="onepd-mapbox-api-key-input-group">
                <input type="text"
                       name="<?php echo esc_attr(self::OPTION_NAME); ?>"
                       value="<?php echo esc_attr($value); ?>"
                       class="regular-text"
                       required>
                <button type="button" 
                        class="onepd-mapbox-api-key-toggle" 
                        aria-label="<?php esc_attr_e('Toggle visibility', 'onepd-mapbox'); ?>">
                    <span class="dashicons dashicons-visibility"></span>
                </button>
            </div>
            <p class="description">
                <?php echo esc_html__('You can find your API key in your Mapbox account settings.', 'onepd-mapbox'); ?>
                <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer">
                    <?php echo esc_html__('Get an API key', 'onepd-mapbox'); ?>
                    <span class="dashicons dashicons-external"></span>
                </a>
            </p>
        </div>
        <?php
    }
}
