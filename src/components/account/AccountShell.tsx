import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AccountMobileNav } from "@/components/account/AccountMobileNav";
import { Stagger } from "@/components/motion/Stagger";

interface AccountShellProps {
  children: React.ReactNode;
}

export function AccountShell({ children }: AccountShellProps) {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 motion-page-account">
      <AccountMobileNav />
      <Stagger className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6" step={70}>
        <div className="hidden lg:block">
          <AccountSidebar />
        </div>
        <div className="lg:col-span-3 space-y-4 sm:space-y-6 min-w-0">{children}</div>
      </Stagger>
    </div>
  );
}
