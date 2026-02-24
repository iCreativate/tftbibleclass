/**
 * Fallback for parallel route slots when Next.js cannot determine the active state.
 * Prevents "No default component was found for a parallel route" warning.
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/default
 */
export default function Default() {
  return null;
}
