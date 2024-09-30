'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { fetchSprints } from '@/app/actions'
import { CommandList } from 'cmdk'

interface SprintSelectorProps {
  onSelect: (sprints: Sprint[]) => void
  selectedSprints: Sprint[]
}

interface Sprint {
  value: string;
  label: string;
}

export default function SprintSelector({ onSelect, selectedSprints }: SprintSelectorProps) {
  const [open, setOpen] = useState(false)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSprints() {
      try {
        const fetchedSprints = await fetchSprints()
        if (Array.isArray(fetchedSprints) && fetchedSprints.length > 0) {
          setSprints(fetchedSprints)
        } else {
          throw new Error('No sprints fetched')
        }
        setLoading(false)
      } catch (err) {
        console.error('Error loading sprints:', err)
        setError('Failed to load sprints. Please try again.')
        setLoading(false)
      }
    }

    loadSprints()
  }, [])

  const handleSelect = (sprint: Sprint) => {
    const updatedSprints = selectedSprints.some(s => s.value === sprint.value)
      ? selectedSprints.filter(s => s.value !== sprint.value)
      : [...selectedSprints, sprint];
    onSelect(updatedSprints);
  }

  if (loading) {
    return <div>Loading sprints...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedSprints.length > 0
            ? `${selectedSprints.length} sprint${selectedSprints.length > 1 ? 's' : ''} selected`
            : "Select sprints..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search sprints..." />
          <CommandList>
          <CommandEmpty>No sprint found.</CommandEmpty>
          <CommandGroup>
            {sprints.length > 0 ? (
              sprints.map((sprint) => (
                <CommandItem
                  key={sprint.value}
                  onSelect={() => handleSelect(sprint)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedSprints.some(s => s.value === sprint.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {sprint.label}
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>No sprints available</CommandItem>
            )}
          </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}