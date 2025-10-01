<?php
/**
 * Custom Post Type and Taxonomy Registration
 * Defines all CPTs, Taxonomies, and Custom Fields, using the 'lm_' prefix for isolation. This file has been refactored
 * to use a configuration-based approach, reducing boilerplate and improving maintainability.
 */

defined( 'ABSPATH' ) || die;

/**
 * Helper function to generate CPT and Taxonomy labels.
 *
 * @param string $singular Singular name (e.g., 'Book').
 * @param string $plural   Plural name (e.g., 'Books').
 * @param string $domain   Text domain for internationalization.
 * @return array The array of labels.
 */
function lm_generate_labels( $singular, $plural, $domain = 'lesson-management' ) {
	return array(
		'name'          => _x( $plural, 'Post Type General Name', $domain ),
		'singular_name' => _x( $singular, 'Post Type Singular Name', $domain ),
		'menu_name'     => __( $plural, $domain ),
		'all_items'     => __( 'All ' . $plural, $domain ),
		'add_new_item'  => __( 'Add New ' . $singular, $domain ),
		'edit_item'     => __( 'Edit ' . $singular, $domain ),
		'update_item'   => __( 'Update ' . $singular, $domain ),
		'view_item'     => __( 'View ' . $singular, $domain ),
	);
}

/**
 * Helper function to register a taxonomy with common arguments.
 *
 * @param string $slug        The taxonomy slug (e.g., 'lm_camp').
 * @param array  $post_types  Post types to attach to.
 * @param array  $custom_args Custom arguments to override defaults.
 */
function lm_register_taxonomy( $slug, $post_types, $custom_args = array() ) {
	$singular = $custom_args['singular'] ?? ucfirst( str_replace( 'lm_', '', $slug ) );
	$plural   = $custom_args['plural'] ?? $singular . 's';

	$default_args = array(
		'labels'            => lm_generate_labels( $singular, $plural ),
		'hierarchical'      => true,
		'public'            => true,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => str_replace( '_', '-', $slug ) ),
		'show_in_rest'      => true,
		'capabilities'      => array( 'assign_terms' => 'edit_posts' ),
	);

	register_taxonomy( $slug, $post_types, array_merge( $default_args, $custom_args ) );
}

add_action( 'init', 'lm_register_custom_post_types' );
/**
 * Register all Custom Post Types and Taxonomies from the JSON export.
 */
function lm_register_custom_post_types() {

	// --- TAXONOMIES ---
	lm_register_taxonomy( 'lm_camp', array( 'lm-group' ) );
	lm_register_taxonomy( 'lm_location', array( 'lm-group', 'daily_log', 'day_location' ) );
	lm_register_taxonomy( 'lm_year', array( 'lm-group' ), array( 'hierarchical' => false ) );
	lm_register_taxonomy( 'lm_animal', array( 'lm-group' ) );

    // --- CPT: Swimmers (lm_swimmer) -----------------------------------------------------------------------------------
    $args_swimmer = array(
        'label'        => __( 'Swimmer', 'lesson-management' ),
		'labels'       => lm_generate_labels( 'Swimmer', 'Swimmers' ),
        'public'       => true,
        'show_ui'      => false,
        'hierarchical' => false,
        'menu_icon'    => 'dashicons-groups',
        'supports'     => array( 'title', 'thumbnail', 'comments' ),
        'has_archive'  => false,
		'rewrite'      => array( 'slug' => 'lm-swimmer' ),
		'show_in_rest' => true,
        'taxonomies'   => array( 'lm-camp' )
    );
    register_post_type( 'lm-swimmer', $args_swimmer );


    // --- CPT: Levels (lm_level) ---------------------------------------------------------------------------------------
    $args_level = array(
        'label'        => __( 'Levels', 'lesson-management' ),
		'labels'       => lm_generate_labels( 'Level', 'Levels' ),
        'public'       => true,
        'show_ui'      => false,
        'hierarchical' => false,
        'menu_icon'    => 'dashicons-editor-table',
        'supports'     => array( 'title', 'editor', 'custom-fields' ),
        'has_archive'  => false,
		'rewrite'      => array( 'slug' => 'lm-level' ),
		'show_in_rest' => true,
    );
    register_post_type( 'lm-level', $args_level );


    // --- CPT: Skills (lm_skill) ---------------------------------------------------------------------------------------
    $args_skill = array(
        'label'        => __( 'Skills', 'lesson-management' ),
		'labels'       => lm_generate_labels( 'Skill', 'Skills' ),
        'public'       => true,
        'show_ui'      => false,
        'hierarchical' => false,
        'menu_icon'    => 'dashicons-book-alt',
        'supports'     => array( 'title', 'editor', 'custom-fields' ),
        'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'lm-skill' ),
		'show_in_rest' => true,
    );
    register_post_type( 'lm-skill', $args_skill );


    // --- CPT: Groups (Classes) (lm_group) -----------------------------------------------------------------------------
    $args_group = array(
        'label'        => __( 'Groups (Classes)', 'lesson-management' ),
		'labels'       => lm_generate_labels( 'Group', 'Groups (Classes)' ),
        'public'       => true,
        'show_ui'      => false,
        'hierarchical' => false,
        'menu_icon'    => 'dashicons-feedback',
        'supports'     => array( 'title', 'comments', 'thumbnail', 'excerpt' ),
        'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'lm-group' ),
		'show_in_rest' => true,
        'taxonomies'   => array( 'lm-camp', 'lm-location', 'lm-year', 'lm-animal' )
    );
    register_post_type( 'lm-group', $args_group );
    
    // --- CPT: Evaluations (lm_evaluation) ---------------------------------------------------------------------------
    $args_evaluation = array(
        'label'        => __( 'Evaluations', 'lesson-management' ),
		'labels'       => lm_generate_labels( 'Evaluation', 'Evaluations' ),
        'public'       => true,
        'show_ui'      => false,
        'hierarchical' => false,
        'menu_icon'    => 'dashicons-text-page',
        'supports'     => array( 'title', 'author', 'thumbnail', 'comments' ),
        'has_archive'  => true,
        'rewrite'      => array( 'slug' => 'lm-evaluation' ),
        'show_in_rest' => true,
    );
    register_post_type( 'lm-evaluation', $args_evaluation );
}

add_action( 'init', 'lm_register_custom_meta' );
/**
 * Register custom meta fields and relationships.
 * The meta keys themselves do NOT need prefixing, only the CPT name they attach to.
 */
function lm_register_custom_meta() {
    $auth_callback = function() {
        return current_user_can( 'edit_posts' );
    };

    $meta_fields = [
        'lm-swimmer' => [
            'parent_name'       => [ 'type' => 'string' ],
            'parent_email'      => [ 'type' => 'string', 'required' => true ],
            'date_of_birth'     => [ 'type' => 'string', 'required' => true ],
            'notes_by_lc'       => [ 'type' => 'string' ],
            'current_level'     => [ 'type' => 'integer' ],
            'levels_mastered'   => [ 'type' => 'array', 'single' => false ],
            'skills_mastered'   => [ 'type' => 'array', 'single' => false ],
            'evaluations'       => [ 'type' => 'array', 'single' => false ],
            'group'             => [ 'type' => 'array', 'single' => false ],
        ],
        'lm-level' => [
            'sort_order'        => [ 'type' => 'number', 'required' => true ],
            'related_skills'    => [ 'type' => 'array', 'single' => false ],
            'group_class'       => [ 'type' => 'array', 'single' => false ],
            'swimmers_mastered' => [ 'type' => 'array', 'single' => false ],
            'evaluated'         => [ 'type' => 'array', 'single' => false ],
        ],
        'lm-skill' => [
            'sort_order'        => [ 'type' => 'number', 'required' => true ],
            'level_associated'  => [ 'type' => 'integer', 'required' => true ],
            'swimmer_skilled'   => [ 'type' => 'array', 'single' => false ],
        ],
        'lm-group' => [
            'level'         => [ 'type' => 'integer', 'auth_callback' => $auth_callback ],
            'instructor'    => [ 'type' => 'array', 'auth_callback' => $auth_callback ],
            'swimmers'      => [ 'type' => 'array', 'auth_callback' => $auth_callback ],
            'days'          => [ 'type' => 'array', 'auth_callback' => $auth_callback ],
            'group_time'    => [ 'type' => 'string', 'auth_callback' => $auth_callback ],
            'lesson_type'   => [ 'type' => 'string', 'auth_callback' => $auth_callback ],
            'dates_offered' => [ 'type' => 'array', 'auth_callback' => $auth_callback ],
            'media'         => [ 'type' => 'integer' ],
            'archived'      => [ 'type' => 'boolean', 'auth_callback' => $auth_callback ],
            'year'          => [ 'type' => 'integer', 'auth_callback' => $auth_callback ],
        ],
        'lm-evaluation' => [
            'swimmer'         => [ 'type' => 'integer' ],
            'level_evaluated' => [ 'type' => 'integer' ],
            'details'         => [ 'type' => 'string' ],
            'emailed'         => [ 'type' => 'boolean' ],
        ],
    ];

    foreach ( $meta_fields as $cpt => $fields ) {
        foreach ( $fields as $meta_key => $args ) {
            $defaults = [
                'show_in_rest' => true,
                'single'       => true,
            ];

            if ( $args['type'] === 'array' ) {
                $defaults['show_in_rest'] = [ 'schema' => [ 'type' => 'array', 'items' => [ 'type' => 'integer' ] ] ];
                if ( $meta_key === 'days' || $meta_key === 'dates_offered' ) {
                    $defaults['show_in_rest']['schema']['items']['type'] = 'string';
                }
            }

            register_post_meta( $cpt, $meta_key, array_merge( $defaults, $args ) );
        }
    }
}