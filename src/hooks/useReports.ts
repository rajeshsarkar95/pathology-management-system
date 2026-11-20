"use client";
import { useState, useEffect, useCallback } from "react";

import type { Report } from "@/types";

export function useReports(token: string | null){
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchReports = useCallback(
    async (search = "", status = "") => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const res = await fetch(`/api/reports?${params}`,{
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setReports(data.data);
        else setError(data.message);
      } catch {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    },

    [token]

  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refetch: fetchReports };
}
