import React from "react";

export default function EligibilityBadge({ eligible }: { eligible: boolean }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {eligible ? 'Eligible' : 'Not eligible'}
    </span>
  );
}
