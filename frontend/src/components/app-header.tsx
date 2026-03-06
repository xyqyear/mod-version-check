import { useLocation, Link } from "react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import SyncStatusBadge from "@/components/SyncStatusBadge";

export function AppHeader() {
  const location = useLocation();

  const breadcrumbs = buildBreadcrumbs(location.pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, i) => (
            <BreadcrumbItem key={crumb.path}>
              {i > 0 && <BreadcrumbSeparator />}
              {i === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto">
        <SyncStatusBadge />
      </div>
    </header>
  );
}

function buildBreadcrumbs(pathname: string) {
  const crumbs: { label: string; path: string }[] = [
    { label: "Home", path: "/" },
  ];

  if (pathname.startsWith("/profiles/")) {
    crumbs.push({ label: "Profile", path: pathname });
  } else if (pathname === "/settings") {
    crumbs.push({ label: "Settings", path: "/settings" });
  }

  return crumbs;
}
