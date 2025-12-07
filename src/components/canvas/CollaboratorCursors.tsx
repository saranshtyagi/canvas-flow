import { motion, AnimatePresence } from "framer-motion";

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

interface CollaboratorCursorsProps {
  collaborators: Collaborator[];
}

export const CollaboratorCursors = ({ collaborators }: CollaboratorCursorsProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {collaborators.map((collaborator) => {
          if (!collaborator.cursor) return null;

          return (
            <motion.div
              key={collaborator.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: collaborator.cursor.x,
                y: collaborator.cursor.y,
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
              className="absolute top-0 left-0"
              style={{ willChange: "transform" }}
            >
              {/* Cursor arrow */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ 
                  filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.3))`,
                  transform: "translate(-2px, -2px)",
                }}
              >
                <path
                  d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.85 3.21c-.3-.3-.85-.08-.85.35z"
                  fill={collaborator.color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              
              {/* Name label */}
              <div
                className="absolute left-4 top-5 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
                style={{ backgroundColor: collaborator.color }}
              >
                {collaborator.name.split(" ")[0]}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
