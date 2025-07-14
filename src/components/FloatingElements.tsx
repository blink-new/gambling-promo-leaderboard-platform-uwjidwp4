import React from 'react';

export function FloatingElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating weapon 1 - top left */}
      <div className="absolute top-[10%] left-[5%] floating-element-1">
        <img 
          src="/weapon1.png" 
          alt="Weapon 1" 
          className="w-40 h-auto opacity-80 transform rotate-12"
        />
      </div>
      
      {/* Floating blue karambit - top right */}
      <div className="absolute top-[15%] right-[8%] floating-element-2">
        <img 
          src="/weapon4.png" 
          alt="Blue Karambit" 
          className="w-36 h-auto opacity-80 transform -rotate-45"
        />
      </div>
      
      {/* Floating gold knife - bottom left */}
      <div className="absolute bottom-[15%] left-[10%] floating-element-3">
        <img 
          src="/weapon3.png" 
          alt="Gold Knife" 
          className="w-32 h-auto opacity-80 transform rotate-45"
        />
      </div>
    </div>
  );
}