import { Footer } from "@/components/footer";
import { SidebarDemo } from "@/components/sidemenu";

export default function Home() {
  return (
    <div className="flex flex-col">
      <SidebarDemo />
      <Footer/>
    </div>
  );
}