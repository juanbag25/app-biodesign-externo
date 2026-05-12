"use client";

import { createContext, useContext } from "react";

const LabContext = createContext<{ labId: number }>({ labId: 0 });

export function LabProvider({
  labId,
  children,
}: {
  labId: number;
  children: React.ReactNode;
}) {
  return (
    <LabContext.Provider value={{ labId }}>{children}</LabContext.Provider>
  );
}

export function useLabId() {
  const { labId } = useContext(LabContext);
  if (!labId) throw new Error("useLabId must be used within LabProvider");
  return labId;
}
