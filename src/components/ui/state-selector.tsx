import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NIGERIA_STATES } from "@/lib/constants/nigeria-states";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StateSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function StateSelect({ value, onChange }: StateSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredStates = NIGERIA_STATES.filter((state) =>
    state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {value || "Select state..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2">
        <Input
          placeholder="Search states..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <ScrollArea className="h-[200px]">
          <div className="space-y-1">
            {filteredStates.map((state) => (
              <Button
                key={state}
                variant={value === state ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  onChange(state);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {state}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 