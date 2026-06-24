import { AccountSidebar } from "@/components/account/AccountSidebar";
import { Stagger } from "@/components/motion/Stagger";

interface AccountShellProps {
  children: React.ReactNode;
}

export function AccountShell({ children }: AccountShellProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 motion-page-account">
      <Stagger className="grid grid-cols-1 lg:grid-cols-4 gap-6" step={70}>
        <AccountSidebar />
        <div className="lg:col-span-3 space-y-6">{children}</div>
      </Stagger>
    </div>
  );
}
