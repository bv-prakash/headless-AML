import Link from "next/link";
import Button from "@/src/components/common/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-theme-primary mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">
        The page you are looking for does not exist.
      </p>
      <Link href="/">
        <Button variant="primary" size="lg">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
