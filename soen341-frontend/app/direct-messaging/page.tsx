import Footer  from "@/Components/footer";
import { SidebarDemo } from "@/Components/sidemenu";

export default function Home() {
  return (
    <div className="flex flex-col">
      <SidebarDemo />
      <Footer/>
    </div>
  );
}