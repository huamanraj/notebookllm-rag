import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
      <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to ChaiBook</h1>
      <p className="max-w-md">Create a new notebook or select an existing one from the sidebar to get started.</p>
    </div>
  );
}
