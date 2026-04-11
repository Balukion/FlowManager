import { Button } from "@web/components/ui/button";

interface TaskWatchButtonProps {
  isWatching: boolean;
  onWatch: () => void;
  onUnwatch: () => void;
}

export function TaskWatchButton({ isWatching, onWatch, onUnwatch }: TaskWatchButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={isWatching ? onUnwatch : onWatch}
    >
      {isWatching ? "Deixar de seguir" : "Seguir"}
    </Button>
  );
}
