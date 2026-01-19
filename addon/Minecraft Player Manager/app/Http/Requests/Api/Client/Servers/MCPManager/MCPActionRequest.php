<?php
namespace Pterodactyl\Http\Requests\Api\Client\Servers\MCPManager;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
class MCPActionRequest extends ClientApiRequest
{
    /**
     * Rules to validate this request against.
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'action' => 'required|string',
            'uuid' => 'sometimes|string',
            'name' => 'sometimes|string',
            'ip' => 'sometimes|string',
            'reason' => 'sometimes|string',
            'gamemode' => 'sometimes|integer|min:0|max:3',
            'slot' => 'sometimes|integer|min:0',
            'type' => 'sometimes|string|in:inventory,armor,offhand,ender_chest',
        ];
    }
}
