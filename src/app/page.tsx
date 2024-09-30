import SprintMetrics from "@/components/SprintMetrics";


export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Team Metrics Dashboard</h1>
      <SprintMetrics />
    </main>
  )
}
