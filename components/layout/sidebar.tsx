"use client"

import type React from "react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4">
        <span>Logo</span>
        <button onClick={onClose} className="focus:outline-none">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <nav className="mt-5">
        <ul>
          <li className="p-4 hover:bg-gray-700">
            <a href="#">Dashboard</a>
          </li>
          <li className="p-4 hover:bg-gray-700">
            <a href="#">Products</a>
          </li>
          <li className="p-4 hover:bg-gray-700">
            <a href="#">Customers</a>
          </li>
          <li className="p-4 hover:bg-gray-700">
            <a href="#">Settings</a>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar
