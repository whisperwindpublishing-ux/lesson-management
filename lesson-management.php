<?php
/**
 * Plugin Name: Lesson Management
 * Plugin URI: https://swimmingideas.com/
 * Description: A custom plugin for managing swimming lesson schedules, instructors, and student enrollment.
 * Version: 1.0.20
 * Author: Swimming Ideas, LLC
 * Author URI: https://swimmingideas.com/
 * Text Domain: lesson-management
 * Domain Path: /languages
 * License: GPL2
 */

defined( 'ABSPATH' ) || die;

// Define plugin constants
define( 'LM_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LM_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'LM_VERSION', '1.0.0' );

add_action( 'plugins_loaded', 'lm_load_plugin' );
/**
 * Main plugin loading function.
 *
 * This function includes all the necessary files and ensures that hooks
 * are registered at the correct point in the WordPress lifecycle.
 */
function lm_load_plugin() {
    // Custom Post Types and Taxonomies (can be loaded early)
    require_once LM_PLUGIN_DIR . 'includes/cpt-registration.php';

    // REST API Routes and Endpoints
    require_once LM_PLUGIN_DIR . 'includes/rest-api.php';

    // Frontend Assets and React App
    require_once LM_PLUGIN_DIR . 'includes/frontend-assets.php';

    // Admin Menu and Dashboard Page
    require_once LM_PLUGIN_DIR . 'admin/admin-page.php';
}


/**
 * Utility Functions (if needed)
 */
// require_once LM_PLUGIN_DIR . 'includes/utilities.php';

// Add activation hook to handle database setup or rewriting rules
register_activation_hook( __FILE__, 'lm_plugin_activate' );
function lm_plugin_activate() {
    // We'll define the CPT registration function first, then call it here.
    require_once LM_PLUGIN_DIR . 'includes/cpt-registration.php';
    lm_register_custom_post_types();
    
    // Flush rewrite rules to ensure CPT URLs work immediately
    flush_rewrite_rules();
}

// Add deactivation hook to clean up
register_deactivation_hook( __FILE__, 'lm_plugin_deactivate' );
function lm_plugin_deactivate() {
    // Optionally clean up rewrite rules
    flush_rewrite_rules();
}