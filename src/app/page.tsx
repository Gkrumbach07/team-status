'use client'

import SprintMetrics from "@/components/SprintMetrics";
import { SettingsProvider } from "@/contexts/SettingsContext";

export default function Home() {
  return (
    <SettingsProvider>
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Team Metrics Dashboard</h1>
        <SprintMetrics />
      </main>
    </SettingsProvider>
  )
}
