<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Icons;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UploadIconRequest extends ClientApiRequest
{
    /**
     * Rules to validate this request against.
     */
    public function rules(): array
    {
        return [
            'icon' => 'required|file|image|max:2048', // Max 2MB, must be an image
        ];
    }
}
