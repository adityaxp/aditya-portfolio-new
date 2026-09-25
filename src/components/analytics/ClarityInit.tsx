"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

type ClarityInitProps = {
  projectId?: string;
};

export default function ClarityInit({ projectId }: ClarityInitProps) {
  useEffect(() => {
    const normalizedProjectId = projectId?.trim();
    if (!normalizedProjectId) return;

    Clarity.init(normalizedProjectId);
  }, [projectId]);

  return null;
}
