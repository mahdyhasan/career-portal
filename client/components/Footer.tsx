export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Augmex Technologies. All rights reserved. 
          </p>
        </div>
      </div>
    </footer>
  );
}
