import AppShell from "@/components/AppShell";
import DemoClient from "./DemoClient";

export const metadata = {
  title: "DIT | Demo",
  description: "Try Contrails deepfake detection via API",
};

export default function DemoPage() {
  return (
    <AppShell
      title="API Demo"
      description="Run image or video detection through the Contrails detect API"
      requireVerifier
    >
      <DemoClient />
    </AppShell>
  );
}
