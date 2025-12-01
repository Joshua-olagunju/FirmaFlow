import { useState } from "react";
import Layout from "../../components/Layout";
import { Search, UserPlus, Users, TrendingUp } from "lucide-react";

const Customers = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        {/* Page Header */}
        <div className="w-full flex justify-between items-center rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          <div className="w-full flex-col items-center">
            <h1 className="text-white font-bold text-3xl">Customers</h1>
            <p className="m-0 text-normal font-500 text-slate-200">
              Manage your customer database and relationships
            </p>
          </div>
        </div>

        {/* Top Row: Currency + Counts + Add Customer Button */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full">
          <div className="flex items-center gap-3">
            <span className="text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium border border-slate-200">
              Currency: NGN
            </span>

            <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
              <Users size={16} />0 customers
            </span>
          </div>

          <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition">
            <UserPlus size={18} />
            Add Customer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "all"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : "text-slate-600 hover:text-[#667eea]"
            }`}
          >
            All Customers
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "active"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : "text-slate-600 hover:text-[#667eea]"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("balance")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "balance"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : "text-slate-600 hover:text-[#667eea]"
            }`}
          >
            With Balance
          </button>
        </div>

        {/* Customer Directory Section */}
        <div className="bg-white shadow-lg rounded-xl p-6 mr-2 w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-800">
              Customer Directory
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <TrendingUp size={16} />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition"
            />
          </div>

          {/* Empty State */}
          <div className="text-center py-16 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users size={40} className="text-white" />
            </div>

            <p className="text-slate-600 text-xl font-semibold mb-2">
              No customers yet
            </p>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Start building your customer base by adding your first customer.
              Track their purchases, manage relationships, and grow your
              business.
            </p>

            <button className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition">
              <UserPlus size={18} />
              Add First Customer
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-800">₦0.00</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <p className="text-sm text-slate-600 mb-1">Outstanding Balance</p>
              <p className="text-2xl font-bold text-slate-800">₦0.00</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
              <p className="text-sm text-slate-600 mb-1">Average Order Value</p>
              <p className="text-2xl font-bold text-slate-800">₦0.00</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Customers;
