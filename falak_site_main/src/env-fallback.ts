// Ensure critical env defaults in development to prevent runtime URL errors
if (process.env.NODE_ENV !== "production") {
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  }
}

