import Image from "next/image";
import { getStoreLogo } from "@/src/framework/graphql/store/queries/getStoreLogo";
import Link from "next/link";

type LogoProps = {
  readonly storeViewCode?: string;
};

const Logo = async ({ storeViewCode }: LogoProps) => {
    const storeLogo = await getStoreLogo(storeViewCode);
    const src = storeLogo?.header_logo_url ?? "";
    const width = storeLogo?.logo_width || 242;
    const height = storeLogo?.logo_height || 20;
    if (!src) return null;
    return (
        <div>
            <Link href="/">
            <Image
              src={src}
              alt={storeLogo?.logo_alt ?? "Store logo"}
              width={width}
              height={height}
              priority
              // Ensure aspect ratio isn't affected by any global `img { height: auto }` rules.
              style={{ width: `${width}px`, height: `${height}px`, objectFit: "cover" }}
            />
            </Link>
        </div>
    )
}

export default Logo;