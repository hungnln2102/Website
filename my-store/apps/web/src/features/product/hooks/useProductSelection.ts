import { useState, useEffect, useMemo, useCallback } from "react";
import type { DurationOption } from "../components/DurationSelector";

interface UseProductSelectionOptions {
  durationOptions: DurationOption[];
}

export function useProductSelection({ durationOptions }: UseProductSelectionOptions) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  // Store initial URL params
  const initialUrlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      package: params.get("package"),
      duration: params.get("duration"),
    };
  }, []);

  // Load from URL on mount
  useEffect(() => {
    if (initialUrlParams.package) {
      setSelectedPackage(initialUrlParams.package);
    }
    if (initialUrlParams.duration) {
      setSelectedDuration(initialUrlParams.duration);
    }
  }, [initialUrlParams]);

  // Update URL
  const updateURL = useCallback((packageId: string | null, durationKey: string | null) => {
    const url = new URL(window.location.href);

    if (packageId) {
      url.searchParams.set("package", packageId);
    } else {
      url.searchParams.delete("package");
    }

    if (durationKey) {
      url.searchParams.set("duration", durationKey);
    } else {
      url.searchParams.delete("duration");
    }

    window.history.replaceState({}, "", url.toString());
  }, []);

  // Handle duration options change
  useEffect(() => {
    if (!durationOptions.length) {
      if (selectedDuration !== null && selectedDuration !== initialUrlParams.duration) {
        setSelectedDuration(null);
      }
      return;
    }

    if (
      selectedDuration &&
      !durationOptions.some((option) => option.key === selectedDuration) &&
      selectedDuration !== initialUrlParams.duration
    ) {
      setSelectedDuration(null);
    }
  }, [durationOptions, selectedDuration, initialUrlParams.duration]);

  // Get selected duration data
  const selectedDurationData = useMemo(
    () => durationOptions.find((option) => option.key === selectedDuration) || null,
    [durationOptions, selectedDuration]
  );

  // Handlers
  const handlePackageSelect = useCallback(
    (packageId: string) => {
      setSelectedPackage(packageId);
      setSelectedDuration(null);
      updateURL(packageId, null);
    },
    [updateURL]
  );

  const handleDurationSelect = useCallback(
    (durationKey: string) => {
      setSelectedDuration(durationKey);
      updateURL(selectedPackage, durationKey);
    },
    [selectedPackage, updateURL]
  );

  return {
    selectedPackage,
    selectedDuration,
    selectedDurationData,
    handlePackageSelect,
    handleDurationSelect,
  };
}
