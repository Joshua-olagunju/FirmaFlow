import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex w-full min-h-screen bg-slate-50">

      {/* Sidebar */}
      <div className="w-[260px] bg-white shadow-md mt-1 rounded-lg">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-4 overflow-y-auto mt-0">
        {children}
      </div>

    </div>
  );
};

export default Layout;
