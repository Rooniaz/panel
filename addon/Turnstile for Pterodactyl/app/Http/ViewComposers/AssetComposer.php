<?php

namespace Pterodactyl\Http\ViewComposers;

use Illuminate\View\View;
use Pterodactyl\Services\Helpers\AssetHashService;

class AssetComposer
{
    /**
     * AssetComposer constructor.
     */
    public function __construct(private AssetHashService $assetHashService)
    {
    }

    /**
     * Provide access to the asset service in the views.
     */
    public function compose(View $view): void
    {
        $view->with('asset', $this->assetHashService);
        $captcha = config('recaptcha.enabled');

        $view->with('siteConfiguration', [
            'name' => config('app.name') ?? 'Pterodactyl',
            'locale' => config('app.locale') ?? 'en',
            'recaptcha' => [
                'enabled' => $captcha === 'true',
                'siteKey' => config('recaptcha.website_key') ?? '',
            ],
            'turnstile' => [
                'enabled' => $captcha === 'turnstile',
                'siteKey' => config('turnstile.key') ?? '',
            ],
        ]);
    }
}
