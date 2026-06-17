export function UserRoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    CLIENT: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || "bg-gray-100 text-gray-700"}`}>
      {role.replace("_", " ")}
    </span>
  );
}
