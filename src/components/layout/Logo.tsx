import Image from "next/image";
import { getStoreLogo } from "@/src/framework/graphql/store/queries/getStoreLogo";
import Link from "next/link";
const placeholderLogo = "/images/AML_update-logo.png";

type LogoProps = {
  readonly storeViewCode?: string;
};

const Logo = async ({ storeViewCode }: LogoProps) => {
    const storeLogo = await getStoreLogo(storeViewCode);

    const hasValidSrc = storeLogo?.header_logo_url && storeLogo.header_logo_url.trim() !== "";
    const src = hasValidSrc ? storeLogo.header_logo_url : placeholderLogo;
    const width = storeLogo?.logo_width || 242;
    const height = storeLogo?.logo_height || 20;
    
    return (
          <Link href="/" className="rtl:ml-auto ltr:mr-auto z-[5] max-w-[60%] relative" aria-label="Home">
            <Image
              src={src}
              alt={storeLogo?.logo_alt ?? "Store logo"}
              width={width}
              height={height}
              priority
              className="h-auto block md:max-h-inherit"
            />
          </Link>
    )
}

export default Logo;