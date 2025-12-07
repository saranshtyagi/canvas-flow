import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Collaborator {
  id: string;
  name: string;
  color: string;
}

interface CollaboratorAvatarsProps {
  collaborators: Collaborator[];
  isConnected: boolean;
}

export const CollaboratorAvatars = ({ collaborators, isConnected }: CollaboratorAvatarsProps) => {
  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Connection indicator */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span>Live</span>
      </div>

      {/* Collaborator avatars */}
      <AnimatePresence>
        {collaborators.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center"
          >
            <TooltipProvider>
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((collaborator, index) => (
                  <Tooltip key={collaborator.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative h-7 w-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white shadow-sm cursor-default"
                        style={{ 
                          backgroundColor: collaborator.color,
                          zIndex: 10 - index,
                        }}
                      >
                        {collaborator.name.charAt(0).toUpperCase()}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{collaborator.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                
                {collaborators.length > 3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shadow-sm cursor-default"
                        style={{ zIndex: 6 }}
                      >
                        +{collaborators.length - 3}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{collaborators.slice(3).map(c => c.name).join(", ")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>

            <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{collaborators.length + 1}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
