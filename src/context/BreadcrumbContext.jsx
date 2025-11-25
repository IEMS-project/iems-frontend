import React, { createContext, useContext, useState } from "react";

const BreadcrumbContext = createContext(null);

export function BreadcrumbProvider({ children }) {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState(null);

  return (
    <BreadcrumbContext.Provider value={{ customBreadcrumbs, setCustomBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    return { customBreadcrumbs: null, setCustomBreadcrumbs: () => {} };
  }
  return context;
}






