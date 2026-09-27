import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/images/logo.png";
import { AddressSearch } from "./AddressSearch";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-5 sm:px-6 md:flex-row md:gap-8 lg:px-8">
        <Link href="/adus" className="shrink-0">
          <Image src={logo} alt="Pacific Manufactured Homes" className="h-12 w-auto" priority />
        </Link>
        <div className="flex w-full flex-1 justify-center md:pr-24">
          <AddressSearch />
        </div>
      </div>
    </header>
  );
}
