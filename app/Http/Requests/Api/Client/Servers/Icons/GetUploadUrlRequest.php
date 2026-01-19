<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Icons;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class GetUploadUrlRequest extends ClientApiRequest
{
    /**
     * Rules to validate this request against.
     */
    public function rules(): array
    {
        return [];
    }
}
