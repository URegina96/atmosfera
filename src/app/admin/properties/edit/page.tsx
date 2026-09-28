"use client";

import { Suspense } from "react";
import { PropertyEditor } from "@/components/admin/PropertyEditor";

export default function Page() {
  return (
    <Suspense>
      <PropertyEditor />
    </Suspense>
  );
}
