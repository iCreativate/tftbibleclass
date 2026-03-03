"use client";

import { recordMaterialAccessed } from "./actions";

type Props = {
  moduleId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
};

/** Material link that records "material accessed" when clicked (so quiz can be unlocked). */
export function MaterialDownloadLink({ moduleId, href, className, children }: Props) {
  function handleClick() {
    recordMaterialAccessed(moduleId);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
