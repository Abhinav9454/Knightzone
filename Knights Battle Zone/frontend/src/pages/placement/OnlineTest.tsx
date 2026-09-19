import { TestTube } from "lucide-react";

import { ComingSoonState } from "@/components/ComingSoonState";

export default function OnlineTest() {
  return (
    <ComingSoonState
      title="Online Placement Test"
      description="Question rendering, secure session flow, and answer submission are still under rollout."
      note="Until the test engine is fully connected, this page will stay in coming-soon mode instead of showing half-working clicks."
      icon={TestTube}
    />
  );
}
