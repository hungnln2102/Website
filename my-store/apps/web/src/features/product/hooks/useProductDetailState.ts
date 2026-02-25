import { useState, useEffect, useCallback } from "react";
import { getDefaultAdditionalInfo } from "../components";

export function useProductDetailState() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState<Record<string, string>>(
    getDefaultAdditionalInfo
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPackage = params.get("package");
    const urlDuration = params.get("duration");
    if (urlPackage) setSelectedPackage(urlPackage);
    if (urlDuration) setSelectedDuration(urlDuration);
  }, []);

  const updateURL = useCallback((packageId: string | null, durationKey: string | null) => {
    const url = new URL(window.location.href);
    if (packageId) url.searchParams.set("package", packageId);
    else url.searchParams.delete("package");
    if (durationKey) url.searchParams.set("duration", durationKey);
    else url.searchParams.delete("duration");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handlePackageSelect = useCallback((packageId: string) => {
    setSelectedPackage(packageId);
    setSelectedDuration(null);
    updateURL(packageId, null);
  }, [updateURL]);

  const handleDurationSelect = useCallback((durationKey: string) => {
    setSelectedDuration(durationKey);
    updateURL(selectedPackage, durationKey);
  }, [selectedPackage, updateURL]);

  const resetAdditionalInfoForForm = useCallback((formId: number | null) => {
    if (formId != null && formId > 0) {
      setAdditionalInfo({});
    } else {
      setAdditionalInfo(getDefaultAdditionalInfo());
    }
  }, []);

  return {
    selectedPackage,
    selectedDuration,
    additionalInfo,
    setAdditionalInfo,
    handlePackageSelect,
    handleDurationSelect,
    resetAdditionalInfoForForm,
  };
}
