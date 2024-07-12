import { clerkMiddleware, createRouteMatcher  } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(['/(.*)', '/api/webhook(.*)', '/api/create-chat(.*)']);

export default clerkMiddleware((auth, request) => {
  if(!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};