<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Turnstile Keys
    |--------------------------------------------------------------------------
    |
    | This is the site key and secret used when making requests to Turnstile.
    | These are loaded from the database and should not be changed here.
    |
    */
    'key' => env('TURNSTILE_SITE_KEY'),
    'secret' => env('TURNSTILE_SECRET_KEY'),
];
