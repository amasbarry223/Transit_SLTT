import { useId, type SVGProps } from "react";

/** Icône "dossier" skeuomorphique (identité visuelle du module pivot Dossiers). */
export function DossierIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  const uid = useId();
  const gradA = `dossier-a-${uid}`;
  const gradB = `dossier-b-${uid}`;

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...props}>
      <linearGradient id={gradA} x1="24" x2="24" y1="6.708" y2="14.977" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#eba600" />
        <stop offset="1" stopColor="#c28200" />
      </linearGradient>
      <path
        fill={`url(#${gradA})`}
        d="M24.414,10.414l-2.536-2.536C21.316,7.316,20.553,7,19.757,7L5,7C3.895,7,3,7.895,3,9l0,30
	c0,1.105,0.895,2,2,2l38,0c1.105,0,2-0.895,2-2V13c0-1.105-0.895-2-2-2l-17.172,0C25.298,11,24.789,10.789,24.414,10.414z"
      />
      <linearGradient id={gradB} x1="24" x2="24" y1="10.854" y2="40.983" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffd869" />
        <stop offset="1" stopColor="#fec52b" />
      </linearGradient>
      <path
        fill={`url(#${gradB})`}
        d="M21.586,14.414l3.268-3.268C24.947,11.053,25.074,11,25.207,11H43c1.105,0,2,0.895,2,2v26
	c0,1.105-0.895,2-2,2H5c-1.105,0-2-0.895-2-2V15.5C3,15.224,3.224,15,3.5,15h16.672C20.702,15,21.211,14.789,21.586,14.414z"
      />
    </svg>
  );
}
