import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";

const FloatingAIBubble = ({ onOpenChat }) => {
  const { theme } = useTheme();
  const [position, setPosition] = useState({ x: 320, y: 100 }); // Start outside sidebar
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bubbleSize = 60; // bubble diameter

    // Calculate boundaries (exclude sidebar area)
    // Desktop sidebar is ~280px, mobile is full width but we handle via media query
    const sidebarWidth = window.innerWidth >= 768 ? 280 : 0;
    const minX = sidebarWidth + 20; // Extra padding from sidebar
    const maxX = viewportWidth - bubbleSize - 20;
    const minY = 20;
    const maxY = viewportHeight - bubbleSize - 20;

    // Constrain position within boundaries
    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));

    setPosition({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!isDragging) {
      onOpenChat();
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <motion.div
      ref={bubbleRef}
      className={`fixed z-50 cursor-pointer ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ${theme.bgGradient}`}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        {/* AI Icon */}
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>

        {/* Pulse effect */}
        <div
          className="absolute w-16 h-16 rounded-full opacity-75 animate-ping"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        className={`absolute left-20 top-1/2 transform -translate-y-1/2 ${theme.bgAccent} ${theme.textPrimary} px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none`}
      >
        <div className="text-sm font-medium">AI Assistant</div>
        <div className="text-xs opacity-75">Click to automate tasks</div>
      </div>
    </motion.div>
  );
};

export default FloatingAIBubble;
