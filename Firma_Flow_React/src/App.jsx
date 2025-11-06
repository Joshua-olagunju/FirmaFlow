import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center gap-8 mb-8">
          <a href="https://vite.dev" target="_blank" className="transition-transform hover:scale-110">
            <img src={viteLogo} className="h-24 w-24" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" className="transition-transform hover:scale-110">
            <img src={reactLogo} className="h-24 w-24 animate-spin-slow" alt="React logo" />
          </a>
        </div>
        <h1 className="text-6xl font-bold text-white mb-8">Vite + React + Tailwind</h1>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="bg-white text-purple-600 font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-purple-100 transition-all hover:scale-105 active:scale-95"
          >
            count is {count}
          </button>
          <p className="text-white mt-6">
            Edit <code className="bg-white/20 px-2 py-1 rounded">src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="text-white/80 mt-8 text-sm underline">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}

export default App
