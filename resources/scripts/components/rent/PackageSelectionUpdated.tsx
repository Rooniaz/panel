import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled, { keyframes, css } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Package } from './RentServerContainer';
import { getHardwareDetail } from '@/api/spring/hardware';
import { 
    getPackagesAvailability, 
    getAvailabilityBadge, 
    getAvailabilityBadgeColor,
    type PackageAvailabilitySummary 
} from '@/api/spring/packageAvailability';

// Reuse existing styled components from PackageSelection.tsx
// ... (copy all styled components from original file)

interface Props {
    hardwareId: string;
    onSelect: (pkg: Package) => void;
    onBack: () => void;
}

/**
 * Updated PackageSelection component that uses dynamic availability API
 */
export default ({ hardwareId, onSelect, onBack }: Props) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [availabilityMap, setAvailabilityMap] = useState<Map<number, PackageAvailabilitySummary>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch packages from hardware API
                const hardwareDetail = await getHardwareDetail(hardwareId);

                // Fetch availability from new API
                let availabilityData: Map<number, PackageAvailabilitySummary> = new Map();
                try {
                    const availabilityResponse = await getPackagesAvailability();
                    availabilityResponse.packages.forEach((pkg) => {
                        availabilityData.set(pkg.packageId, pkg);
                    });
                    setAvailabilityMap(availabilityData);
                } catch (availabilityError) {
                    console.warn('Failed to fetch availability, using fallback:', availabilityError);
                    // Continue without availability data
                }

                const allPackages: Package[] = [];
                let packageIndex = 1;

                Object.values(hardwareDetail.categoryContainers).forEach((categoryPackages) => {
                    categoryPackages.forEach((pkg) => {
                        const packageId = pkg.packageId || packageIndex++;
                        const pricePerHour = pkg.price ?? pkg.hourlyRate;
                        
                        // Get availability from API
                        const availability = availabilityData.get(packageId);
                        const isAvailable = availability?.isAvailable ?? true;
                        const status = availability?.status ?? 'available';
                        const isFull = !isAvailable || status === 'unavailable';
                        const isRecommended = pkg.name.toLowerCase().includes('diamond');

                        allPackages.push({
                            id: `${hardwareId}-${pkg.name}`,
                            packageId: packageId,
                            name: pkg.name,
                            cpu: parseInt(pkg.cpu, 10),
                            ram: parseInt(pkg.ram.replace(' GB', ''), 10),
                            storage: parseInt(pkg.storage.replace(' GB', ''), 10),
                            pricePerHour: pricePerHour,
                            isFull: isFull,
                            isRecommended: isRecommended,
                            // Store availability data for later use
                            capacity: undefined,
                            rentedCount: undefined,
                            availableCount: availability?.availableNodesCount,
                        });
                    });
                });

                allPackages.sort((a, b) => {
                    if (a.isRecommended && !b.isRecommended) return -1;
                    if (!a.isRecommended && b.isRecommended) return 1;
                    return a.pricePerHour - b.pricePerHour;
                });

                setPackages(allPackages);
            } catch (err: any) {
                setError(err.message || 'Failed to load packages');
            } finally {
                setLoading(false);
            }
        };

        if (hardwareId) {
            fetchPackages();
        }
    }, [hardwareId]);

    // Helper function to get status badge text
    const getStatusText = (packageId: number): string => {
        const availability = availabilityMap.get(packageId);
        if (!availability) {
            return 'พร้อมใช้งาน';
        }
        return getAvailabilityBadge(availability.status);
    };

    // Helper function to check if package is full
    const isPackageFull = (packageId: number): boolean => {
        const availability = availabilityMap.get(packageId);
        if (!availability) {
            return false;
        }
        return !availability.isAvailable || availability.status === 'unavailable';
    };

    // ... (rest of the component JSX from original file, but update StatusBadge to use new logic)
    
    // Note: This is a reference implementation
    // You should copy the full JSX from PackageSelection.tsx and update:
    // 1. StatusBadge to use getStatusText() instead of hardcoded logic
    // 2. PackageCard $isFull prop to use isPackageFull()
    // 3. Remove capacity/rentedCount logic
};

