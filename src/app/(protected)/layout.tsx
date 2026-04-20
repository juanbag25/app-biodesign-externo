import { getCurrentLab } from "@/lib/get-current-lab";
import Header from "./header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lab = await getCurrentLab();

  return (
    <>
      <Header labName={lab.name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </>
  );
}
