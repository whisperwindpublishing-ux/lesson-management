<?php
/**
 * Frontend Assets and Scripts
 *
 * @package LessonManagement
 */

defined( 'ABSPATH' ) || die;

add_action( 'admin_enqueue_scripts', 'lm_enqueue_admin_assets' );

/**
 * Enqueues scripts and styles for the admin dashboard.
 *
 * This function checks if the current admin page is our React app's page
 * and, if so, loads the necessary CSS and JS files. It also passes
 * data from PHP to JavaScript using wp_localize_script.
 *
 * @param string $hook The current admin page hook.
 */
function lm_enqueue_admin_assets( $hook ) {
    // Only load assets on our plugin's admin page.
    // 'toplevel_page_lesson-dashboard' is the hook for our menu page.
    if ( 'toplevel_page_lesson-dashboard' !== $hook ) {
        return;
    }

    // Enqueue Tailwind CSS.
    wp_enqueue_style(
        'lm-tailwind-styles',
        LM_PLUGIN_URL . 'assets/css/tailwind.css',
        array(),
        LM_VERSION
    );

    // Enqueue the React application script.
    wp_enqueue_script(
        'lm-react-app',
        LM_PLUGIN_URL . 'assets/js/app.js',
        array( 'wp-element', 'wp-api-fetch' ), // Dependencies
        LM_VERSION,
        true // Load in footer
    );

    // Pass data to the React app.
    wp_localize_script( 'lm-react-app', 'LMData', array(
        'namespace'  => 'lm/v1',
        'nonce'      => wp_create_nonce( 'wp_rest' ),
        'post_types' => array(
            'group' => 'lm-group',
            'level' => 'lm-level',
            'skill' => 'lm-skill',
            'swimmer' => 'lm-swimmer',
        ), // Add a comma here to separate array elements
        'taxonomies' => array(
            'camp' => 'lm-camp',
            'animal' => 'lm-animal',
        ),
    ) );
}