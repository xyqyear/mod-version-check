import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LoaderType, ProfileCreate } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileCreate) => void;
  loading?: boolean;
}

const LOADER_OPTIONS: { value: LoaderType; label: string }[] = [
  { value: "fabric", label: "Fabric" },
  { value: "forge", label: "Forge" },
  { value: "neoforge", label: "NeoForge" },
  { value: "quilt", label: "Quilt" },
];

export default function CreateProfileModal({ open, onClose, onSubmit, loading }: Props) {
  const [name, setName] = useState("");
  const [loader, setLoader] = useState<LoaderType | "">("");

  const handleSubmit = () => {
    if (!name.trim() || !loader) return;
    onSubmit({ name: name.trim(), loader: loader as LoaderType });
    setName("");
    setLoader("");
  };

  const handleClose = () => {
    setName("");
    setLoader("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-sm font-medium">
              Profile Name
            </label>
            <Input
              id="profile-name"
              placeholder="e.g., My Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-loader" className="text-sm font-medium">
              Mod Loader
            </label>
            <Select value={loader} onValueChange={(v) => setLoader(v as LoaderType)}>
              <SelectTrigger id="profile-loader">
                <SelectValue placeholder="Select a loader" />
              </SelectTrigger>
              <SelectContent>
                {LOADER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !loader || loading}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
