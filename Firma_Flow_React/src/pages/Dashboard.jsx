import {useState} from 'react'
import Layout from '../components/Layout'
import { ChevronDown, User } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';

// Sample data matching your design
const salesData = [
  { name: 'Mon', amount: 4000 },
  { name: 'Tue', amount: 3000 },
  { name: 'Wed', amount: 2000 },
  { name: 'Thu', amount: 2780 },
  { name: 'Fri', amount: 1890 },
  { name: 'Sat', amount: 2390 },
  { name: 'Sun', amount: 3490 },
];

const productData = [
  { name: 'Product A', value: 40 },
  { name: 'Product B', value: 30 },
  { name: 'Product C', value: 20 },
  { name: 'Product D', value: 10 },
];

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const COLORS = ['#667eea']
const user = {
    userIcon: <User size={16} className="text-white" />,
    name: "Chris Mike",
    company: "Admin",
};

const Dashboard = () => {
    const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen(!open);

    // const dateString = new Date().toLocaleString();
     // const dateString = new Date().toLocaleString();

  const getInitials = (name) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase();
};

  return (
    <Layout>
      <div className='w-full flex flex-col items-center justify-center gap-8'>
    <div className='w-full flex justify-between items-center rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0'>
      <div className='w-full flex-col items-center pb-4'>
        <h2 className='text-white font-bold text-3xl '>Administrator Dashboard</h2>
         <p className='m-0 text-normal font-500 text-slate-200'>Complete business overview and management insights for administrators.</p>
      </div>
       <div className="relative">
      {/* Container that toggles dropdown */}
      <div
        className="flex w-[160px] h-[55px] py-0.5 px-2 items-center gap-3 border rounded-md border-white cursor-pointer select-none"
        onClick={toggleDropdown}
      >
        <div className="w-8 h-8 shadow-lg rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-lg font-bold overflow-hidden">
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

        <div className="flex-1">
          <p className="font-semibold text-slate-100 text-sm">{user.name}</p>
          <p className="font-normal text-slate-800 text-sm">{user.company}</p>
        </div>

        <ChevronDown
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          size={16}
          color="white"
        />
      </div>

      {/* Dropdown section */}
      {open && (
        <div className="absolute align-center top-full mt-2 w-[160px] bg-white shadow-md rounded-md p-2 z-10">
          <div className="hover:bg-gray-100 p-2 rounded cursor-pointer">Subscription</div>
          <div className="hover:bg-gray-100 p-2 rounded cursor-pointer">Contact Support</div>
         <div className="hover:bg-gray-100 p-2 rounded cursor-pointer border-t border-b border-slate-300">Switch Accounts</div>
          <div className="hover:bg-gray-100 p-2 rounded cursor-pointer">Settings</div>
          <div className="hover:bg-gray-100 p-2 rounded cursor-pointer text-red-400">Logout</div>
        </div>
      )}
    </div>
    </div>

<div className='flex items-center justify-between w-full'>
<div className='flex shadow-lg rounded-lg items-center justify-center bg-white p-4'>
  <div className='flex p-3 items-center gap-4'>
    <div className='flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6'></div>
    <div className='flex flex-col gap-2'>
      <p className='m-0 font-bold text-slate-900 text-3xl'>0</p>
       <p className='m-0 font-normal text-slate-600 text-normal'>Total Customer</p>
        <p className='font-normal text-sm text-slate-700'>0</p>
    </div>
  </div>
</div>
<div className='flex shadow-lg rounded-lg items-center justify-center bg-white p-4'>
  <div className='flex p-3 items-center gap-4'>
    <div className='flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6'></div>
    <div className='flex flex-col gap-2'>
      <p className='m-0 font-bold text-slate-900 text-3xl'>0</p>
       <p className='m-0 font-normal text-slate-600 text-normal'>Products</p>
        <p className='font-normal text-sm text-slate-700'>0</p>
    </div>
  </div>
</div>


<div className='flex shadow-lg rounded-lg items-center justify-center bg-white p-4'>
  <div className='flex p-3 items-center gap-4'>
    <div className='flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6'></div>
    <div className='flex flex-col gap-2'>
      <p className='m-0 font-bold text-slate-900 text-3xl'>₦0.00</p>
       <p className='m-0 font-normal text-slate-600 text-normal'>Total Sales</p>
        <p className='font-normal text-sm text-slate-700'>₦0.00</p>
    </div>
  </div>
</div>


<div className='relative flex shadow-lg rounded-lg items-center justify-center bg-white p-4 mr-2'>
  <div className='flex p-3 items-center gap-4'>
    <div className='flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6'></div>
    <div className='flex flex-col gap-2'>
      <p className='m-0 font-bold text-slate-900 text-3xl'>0</p>
       <p className='m-0 font-normal text-slate-600 text-normal'>Low Stock Items</p>
        <p className='font-normal text-sm text-slate-700'>0</p>
    </div>
  </div>
  <div className='absolute text-normal text-sm text-blue-400 top-0 right-0 p-2'>View</div>
</div>

</div>


   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
  {/* SALES TREND CARD - Takes 2/3 of the space */}
  <div className="bg-white relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-24 after:mb-2 after:bg-slate-100 after:z-0 rounded-2xl shadow-2xl p-6 md:col-span-2">
    <div className="flex justify-between items-center py-4 mb-4 relative z-10">
      <h2 className="text-3xl font-semibold text-slate-800">
        Sales Trend (Last 7 Days)
      </h2>
<p className="text-sm text-slate-500">
  Updated: {new Date().toLocaleString()}
</p>
    </div>

    <div className="w-full" style={{ height: "300px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={salesData}>
          <CartesianGrid stroke="#e5e7eb"/>
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#6172F3"
            strokeWidth={3}
            dot={{ stroke: "#6172F3", strokeWidth: 2, r: 5, fill: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* TOP 10 PRODUCTS CARD - Takes 1/3 of the space */}
  <div className="bg-white mr-2 rounded-2xl shadow-lg p-4 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-24 after:mb-8 after:bg-slate-100 after:z-0">
    <h2 className="text-2xl items-center font-semibold text-slate-800 mb-4 relative z-10 w-2/3 ml-5">
      Top 10 Products (Last 30 Days)
    </h2>

    <div className="flex flex-col items-center">
      {/* Smaller chart container */}
      <div className="w-48" style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={productData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              // label={({ name, value }) => `${name}: ${value}%`}
              labelLine={true}
            >
              {productData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Smaller center text */}
      <div className="relative -top-24 text-center">
        <div className="text-lg font-bold text-slate-700">Total</div>
        <div className="text-md text-slate-600">
          {productData.reduce((sum, item) => sum + item.value, 0)}%
        </div>
      </div>

      {/* Compact legend */}
      <div className="mt-1 grid grid-cols-1 gap-1">
        {productData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: COLORS[index % COLORS.length] }}
            ></span>
            <span className="text-xs text-slate-600">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
    </div>
    </Layout>
  )
}

export default Dashboard