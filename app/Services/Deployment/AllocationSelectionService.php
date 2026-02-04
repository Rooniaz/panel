<?php

namespace Pterodactyl\Services\Deployment;

use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Node;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Services\Allocations\AssignmentService;
use Pterodactyl\Contracts\Repository\AllocationRepositoryInterface;
use Pterodactyl\Exceptions\Service\Deployment\NoViableAllocationException;
use Pterodactyl\Exceptions\Service\Allocation\NoAutoAllocationSpaceAvailableException;

class AllocationSelectionService
{
    protected bool $dedicated = false;

    protected array $nodes = [];

    protected array $ports = [];

    /**
     * AllocationSelectionService constructor.
     */
    public function __construct(private AllocationRepositoryInterface $repository)
    {
    }

    /**
     * Toggle if the selected allocation should be the only allocation belonging
     * to the given IP address. If true an allocation will not be selected if an IP
     * already has another server set to use on if its allocations.
     */
    public function setDedicated(bool $dedicated): self
    {
        $this->dedicated = $dedicated;

        return $this;
    }

    /**
     * A list of node IDs that should be used when selecting an allocation. If empty, all
     * nodes will be used to filter with.
     */
    public function setNodes(array $nodes): self
    {
        $this->nodes = $nodes;

        return $this;
    }

    /**
     * An array of individual ports or port ranges to use when selecting an allocation. If
     * empty, all ports will be considered when finding an allocation. If set, only ports appearing
     * in the array or range will be used.
     *
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function setPorts(array $ports): self
    {
        $stored = [];
        foreach ($ports as $port) {
            if (is_digit($port)) {
                $stored[] = $port;
            }

            // Ranges are stored in the ports array as an array which can be
            // better processed in the repository.
            if (preg_match(AssignmentService::PORT_RANGE_REGEX, $port, $matches)) {
                if (abs($matches[2] - $matches[1]) > AssignmentService::PORT_RANGE_LIMIT) {
                    throw new DisplayException(trans('exceptions.allocations.too_many_ports'));
                }

                $stored[] = [$matches[1], $matches[2]];
            }
        }

        $this->ports = $stored;

        return $this;
    }

    /**
     * Return a single allocation that should be used as the default allocation for a server.
     *
     * @throws \Pterodactyl\Exceptions\Service\Deployment\NoViableAllocationException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\NoAutoAllocationSpaceAvailableException
     */
    public function handle(): Allocation
    {
        $allocation = $this->repository->getRandomAllocation($this->nodes, $this->ports, $this->dedicated);

        // If no unassigned allocation exists, create a new one with a random port
        if (is_null($allocation)) {
            $allocation = $this->createNewAllocation();
            
            if (is_null($allocation)) {
                throw new NoViableAllocationException(trans('exceptions.deployment.no_viable_allocations'));
            }
        }

        return $allocation;
    }

    /**
     * Create a new allocation with a random port that doesn't conflict with existing servers.
     *
     * @throws \Pterodactyl\Exceptions\Service\Allocation\NoAutoAllocationSpaceAvailableException
     */
    protected function createNewAllocation(): ?Allocation
    {
        $start = config('pterodactyl.client_features.allocations.range_start', null);
        $end = config('pterodactyl.client_features.allocations.range_end', null);

        if (!$start || !$end) {
            return null;
        }

        // Get nodes to work with
        $nodes = !empty($this->nodes) 
            ? Node::whereIn('id', $this->nodes)->get() 
            : Node::all();

        if ($nodes->isEmpty()) {
            return null;
        }

        // Try each node until we find one where we can create an allocation
        foreach ($nodes as $node) {
            // Get all ports used by this node
            $nodePorts = $node->allocations()
                ->whereBetween('port', [$start, $end])
                ->pluck('port')
                ->toArray();

            // Get all ports used by all servers on this node (to avoid duplicates across servers)
            $allServerPorts = Allocation::query()
                ->where('node_id', $node->id)
                ->whereBetween('port', [$start, $end])
                ->whereNotNull('server_id')
                ->pluck('port')
                ->toArray();

            // Combine and get available ports
            $usedPorts = array_unique(array_merge($nodePorts, $allServerPorts));
            $available = array_diff(range($start, $end), $usedPorts);

            if (empty($available)) {
                continue; // Try next node
            }

            // Pick a random port
            $port = $available[array_rand($available)];

            // Get the IP from an existing allocation on this node, or use the node's FQDN
            $existingAllocation = $node->allocations()->first();
            $ip = $existingAllocation?->ip ?? $node->fqdn;
            
            if (!$ip) {
                continue; // Skip this node if we can't determine an IP
            }

            // Create the allocation
            try {
                $assignmentService = app(AssignmentService::class);
                $assignmentService->handle($node, [
                    'allocation_ip' => $ip,
                    'allocation_ports' => [(string) $port],
                ]);

                // Find and return the newly created allocation
                $allocation = $node->allocations()
                    ->where('ip', $ip)
                    ->where('port', $port)
                    ->first();

                return $allocation;
            } catch (\Exception $e) {
                // If creation fails, try next node
                continue;
            }
        }

        return null;
    }
}
