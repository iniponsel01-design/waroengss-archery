import Link from "next/link";
import { getBranding } from "@/lib/utils/branding";
import { cn } from "@/lib/utils/cn";
import { Instagram, Facebook, Youtube, Music2, Globe } from "lucide-react";

interface SiteFooterProps {
  dark?: boolean;
}

export async function SiteFooter({ dark = false }: SiteFooterProps) {
  const branding = await getBranding();

  const socialLinks = [
    { href: branding.socialInstagram, icon: Instagram, label: "Instagram" },
    { href: branding.socialFacebook,  icon: Facebook,  label: "Facebook" },
    { href: branding.socialYoutube,   icon: Youtube,   label: "YouTube" },
    { href: branding.socialTiktok,    icon: Music2,    label: "TikTok" },
    { href: branding.brandWebsite,    icon: Globe,     label: "Website" },
  ].filter((s) => !!s.href);

  const legalLinks = [
    { href: "/about",          label: "Tentang" },
    { href: "/contact",        label: "Kontak" },
    { href: "/privacy-policy", label: "Privacy Policy" },
  ];

  return (
    <footer
      className={cn(
        "border-t py-8",
        dark
          ? "bg-gray-950 border-gray-800 text-gray-500"
          : "bg-white border-gray-100 text-gray-500"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "transition-colors",
                  dark
                    ? "text-gray-600 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                )}
                aria-label={label}
              >
                <Icon size={18} />
              </Link>
            ))}
          </div>
        )}

        {/* Footer text + legal links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>{branding.footerText}</p>
          <p className="text-xs opacity-50">Powered by Nusantara Event Gallery</p>
        </div>

        {/* Legal links */}
        <div className="flex items-center justify-center gap-4 text-xs">
          {legalLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "transition-colors hover:underline",
                dark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
