<?php
/**
 * Admin Menu and Dashboard Page Setup
 *
 * @package LessonManagement
 */

defined( 'ABSPATH' ) || die;

add_action( 'admin_menu', 'lm_add_admin_menu' );

/**
 * Adds the main menu page for the Lesson Management plugin.
 */
function lm_add_admin_menu() {
    add_menu_page(
        __( 'Lesson Dashboard', 'lesson-management' ), // Page title
        __( 'Lessons', 'lesson-management' ),          // Menu title
        'manage_options',                              // Capability required
        'lesson-dashboard',                            // Menu slug
        'lm_render_admin_app_page',                    // Callback function to render the page
        'dashicons-welcome-learn-more',                // Icon
        20                                             // Position
    );
}

/**
 * Renders the root HTML element for the React admin application.
 */
function lm_render_admin_app_page() {
    echo '<div id="lm-admin-app" class="wrap"></div>';
}