"use client";

import { createContext, useContext } from "react";

const AdminSessionContext = createContext({ secondsRemaining: 0 });

export const AdminSessionProvider = AdminSessionContext.Provider;

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
