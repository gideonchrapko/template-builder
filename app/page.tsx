import { auth } from "@/lib/auth";
import SignInButton from "@/components/SignInButton";
import DriveGallery from "@/components/DriveGallery";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  // If authenticated, show the full page with templates and drive resources
  if (session) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Botpress Design Tools</h1>
          <p className="mt-2 text-muted-foreground">
            Create templates and access design resources
          </p>
        </div>

        {/* Templates Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Templates</h2>
              <p className="text-muted-foreground mt-1">
                Generate posters and graphics from templates
              </p>
            </div>
            <Link href="/templates">
              <Button variant="outline">View All Templates</Button>
            </Link>
          </div>
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground mb-4">
              Browse and create templates
            </p>
            <Link href="/templates">
              <Button>Go to Templates</Button>
            </Link>
          </div>
        </section>

        {/* Google Drive Resources Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Design Resources</h2>
            <p className="text-muted-foreground mt-1">
              Access images, folders, and documents from Google Drive
            </p>
          </div>
          <DriveGallery />
        </section>
      </div>
    );
  }

  // Not authenticated - show sign in page
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Botpress Design Tools</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in with your Botpress Google account to get started
          </p>
        </div>
        <SignInButton />
      </div>
    </div>
  );
}

