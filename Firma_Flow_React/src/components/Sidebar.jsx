import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, User } from "lucide-react";
import { pageData } from "./pageData";

const user = {
    userIcon: <User size={20} className="text-white" />,
    name: "Chris Mike",
    company: "Arc Mart",
};

const Sidebar = () => {
    const location = useLocation();

    const getInitials = (name) => {
        if (!name) return "";
        const parts = name.split(" ");
        const initials =
            parts[0].charAt(0) + (parts[1] ? parts[1].charAt(0) : "");
        return initials.toUpperCase();
    };

    return (
        <div className="flex flex-col w-[260px] text-center right-0 rounded-lg bg-white items-start justify-start p-2">
            <div className="flex justify-between items-center w-full mb-4">
                <div
                    className="flex gap-2 items-center justify-start group px-2 py-2 rounded-2xl w-full ease-out-in hover:bg-gradient-to-br from-[#eceef8] to-[#f9f7fa]"
                >
                    <div className="bg-white rounded-lg p-1">
                        <img src='./firmaflow-logo.jpg' alt="logo" height={30} width={30} />
                    </div>

                    <div className="relative flex flex-col justify-center items-start leading-none after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#667eea] after:transition-all after:duration-300 group-hover:after:w-full">
                        <p className="m-0 text-xl font-bold bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                            FirmaFlow
                        </p>
                        <p className="m-0 text-slate-500 font-normal text-sm uppercase">
                            Ledger
                        </p>
                    </div>
                </div>

                <ChevronLeft size={18} className="text-slate-500" />
            </div>
            {pageData.map((page, index) => {
                const isActive = location.path === page.path;
                return (
                    <Link
                        to={page.path}
                        key={index}
                        className={`group relative items-center justify-center flex p-2 w-full rounded-md ${
                            isActive
                                ? "text-white"
                                : "hover:bg-gradient-to-br from-[#f1f5f9] to-[#f9f7fa]"
                        }`}
                    >
                        <div className="flex items-center justify-center w-full">
                            <p className="m-0 text-left ml-12 text-normal text-slate-600 font-md flex-1 hover:text-slate-800 hover:font-semibold">
                                {page.name}
                            </p>
                        </div>
                    </Link>
                );
            })}
            <div className="flex w-full border-t border-slate-300 justify-start items-center gap-3 py-3 mt-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-lg font-bold overflow-hidden">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt="user"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        getInitials(user.name)
                    )}
                </div>

                <div>
                    <p className="font-semibold text-slate-700">{user.name}</p>
                    <p className="font-normal text-slate-500">{user.company}</p>
                </div>
            </div>
            <button className="flex w-full items-center justify-center border border-red-400 rounded-md py-1 text-red-400 font-sm">
                Logout
            </button>
        </div>
    );
};

export default Sidebar;
