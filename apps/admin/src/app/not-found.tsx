import { redirect } from 'next/navigation';

// Sections that do not exist yet (or mistyped addresses) go back to the start.
export default function NotFound() {
  redirect('/');
}
