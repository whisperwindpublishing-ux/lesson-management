<?php
/**
 * REST API Routes and Endpoints
 *
 * @package LessonManagement
 */

defined( 'ABSPATH' ) || die;

add_action( 'rest_api_init', 'lm_register_rest_routes' );

/**
 * Registers custom REST API routes for the Lesson Management plugin.
 */
function lm_register_rest_routes() {
    $namespace = 'lm/v1';

    // Register route to get all groups with associated data.
    register_rest_route(
        $namespace,
        '/groups',
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'lm_get_groups_with_details',
            'permission_callback' => function () {
                // Only allow users who can edit posts to access this endpoint.
                return current_user_can( 'edit_posts' );
            },
        )
    );

    // --- ADD THE NEW UPDATE ROUTE BELOW ---
    register_rest_route(
        $namespace,
        '/groups/(?P<id>\d+)', // Matches /lm/v1/groups/12345
        array(
            'methods'             => 'POST', // Or WP_REST_Server::EDITABLE for POST, PUT, PATCH
            'callback'            => 'lm_update_group_details',
            'permission_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
            'args' => array(
                'id' => array(
                    'validate_callback' => function( $param, $request, $key ) {
                        return is_numeric( $param );
                    }
                ),
            ),
        )
    );
}

/**
 * Callback function to fetch lm_group posts with their related data.
 *
 * This custom endpoint is created to avoid complex, multi-step queries on the frontend.
 * It fetches all 'lm_group' posts and enriches them with associated taxonomy terms
 * and related post meta.
 *
 * @param WP_REST_Request $request The REST API request object.
 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
 */
function lm_get_groups_with_details( WP_REST_Request $request ) {
    $args = array(
        'post_type'      => 'lm-group',
        'posts_per_page' => -1, // Retrieve all groups
        'post_status'    => 'publish',
    );

    $query = new WP_Query( $args );

    if ( ! $query->have_posts() ) {
        return new WP_REST_Response( array(), 200 );
    }

    $groups_data = array();

    foreach ( $query->posts as $post ) {
        $query->the_post(); // Set up post data for template tags.
        $post_id = $post->ID;

        // Get associated lm_level post from meta
        $level_id   = get_post_meta( $post_id, 'level', true );
        $level_post = $level_id ? get_post( $level_id ) : null;
        $level_data = $level_post; // Return the full post object, not a simplified array.

        // Get associated taxonomy terms
        $locations = get_the_terms( $post_id, 'lm-location' );
        $camps     = get_the_terms( $post_id, 'lm-camp' );
        $animals   = get_the_terms( $post_id, 'lm-animal' );

        $groups_data[] = array(
            'id'          => $post_id,
            'title'       => $post->post_title,
            // Nest all meta fields to match the structure used for saving.
            'meta'        => [
                'level'         => $level_data ? [ 'id' => $level_data->ID, 'title' => $level_data->post_title ] : null,
                'days'          => get_post_meta( $post_id, 'days', true ) ?: [],
                'group_time'    => get_post_meta( $post_id, 'group_time', true ),
                'instructor'    => get_post_meta( $post_id, 'instructor', true ) ?: [],
                'swimmers'      => get_post_meta( $post_id, 'swimmers', true ) ?: [],
                'lesson_type'   => get_post_meta( $post_id, 'lesson_type', true ),
                'dates_offered' => get_post_meta( $post_id, 'dates_offered', true ) ?: [],
                'archived'      => (bool) get_post_meta( $post_id, 'archived', true ),
                'year'          => get_post_meta( $post_id, 'year', true ),
            ],
            'lm-camp'     => ! is_wp_error( $camps ) && ! empty( $camps ) ? wp_list_pluck( $camps, 'term_id' ) : [],
            'lm-animal'   => ! is_wp_error( $animals ) && ! empty( $animals ) ? wp_list_pluck( $animals, 'term_id' ) : [],
            'lm-location' => ! is_wp_error( $locations ) && ! empty( $locations ) ? wp_list_pluck( $locations, 'term_id' ) : [],
        );
    }

    wp_reset_postdata();

    return new WP_REST_Response( $groups_data, 200 );
}

/**
 * Callback function to update group details.
 * This custom endpoint gives us direct control over the save process.
 */
function lm_update_group_details( WP_REST_Request $request ) {
    $post_id = $request['id'];
    $params = $request->get_json_params();

    // Make sure this post is the correct type, just in case
    if ( 'lm-group' !== get_post_type( $post_id ) ) {
        return new WP_Error( 'invalid_post_type', 'The provided ID is not a group.', array( 'status' => 403 ) );
    }

    // --- 1. Update Post Title ---
    if ( isset( $params['title'] ) ) {
        $post_update = array(
            'ID'         => $post_id,
            'post_title' => sanitize_text_field( $params['title'] ),
        );
        wp_update_post( $post_update );
    }

    // --- 2. Update Meta Fields ---
    if ( isset( $params['meta'] ) && is_array( $params['meta'] ) ) {
        foreach ( $params['meta'] as $key => $value ) {
            // A little sanitization for common types
            if ( is_array( $value ) ) {
                $sanitized_value = array_map( 'sanitize_text_field', $value );
            } elseif ( is_numeric( $value ) ) {
                $sanitized_value = intval( $value );
            } elseif ( is_bool( $value ) ) {
                $sanitized_value = (bool) $value;
            } else {
                $sanitized_value = sanitize_text_field( $value );
            }
            update_post_meta( $post_id, $key, $sanitized_value );
        }
    }
    
    // --- 3. Update Taxonomies ---
    // Handle 'lm-camp'
    if ( isset( $params['lm-camp'] ) ) {
        $camp_ids = array_map( 'intval', $params['lm-camp'] );
        wp_set_object_terms( $post_id, $camp_ids, 'lm-camp', false );
    }
    
    // Handle 'lm-animal'
    if ( isset( $params['lm-animal'] ) ) {
        $animal_ids = array_map( 'intval', $params['lm-animal'] );
        wp_set_object_terms( $post_id, $animal_ids, 'lm-animal', false );
    }

    // Return a success response
    return new WP_REST_Response( array( 'success' => true, 'message' => 'Group updated successfully.' ), 200 );
}