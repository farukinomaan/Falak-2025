export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto p-8 text-center space-y-3">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
      <a className="text-blue-600 underline" href="/">Go back home</a>
    </div>
  );
}

