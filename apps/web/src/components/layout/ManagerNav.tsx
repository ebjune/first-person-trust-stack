import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/pnm", label: "PNM", title: "Personal Network Manager" },
  { to: "/cnm", label: "CNM", title: "Community Network Manager" },
  { to: "/vtn", label: "VTN", title: "VTN Manager" },
  { to: "/infra", label: "Infra", title: "Infrastructure Monitor" },
];

export function ManagerNav() {
  return (
    <nav className="flex gap-1 border-b border-slate-200 bg-white px-4">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          title={tab.title}
          className={({ isActive }) =>
            [
              "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300",
            ].join(" ")
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
