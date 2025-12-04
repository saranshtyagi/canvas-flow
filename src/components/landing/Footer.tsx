import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cta-gradient">
              <Pencil className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Sketchflow</span>
          </Link>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2024 Sketchflow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
