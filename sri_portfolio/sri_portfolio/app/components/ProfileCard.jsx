"use client";

export const ProfileCard = () => {
  return (
    <div 
      className="relative h-full rounded-lg overflow-hidden"
      style={{
        backgroundImage: 'url(/me.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/20 border border-white/20 rounded-lg">
        <div className="relative h-full bg-black/10 rounded-lg flex flex-col">
          {/* CS at top left */}
          <div className="absolute top-3 left-3">
            <span className="text-white font-bold text-xl">CS</span>
          </div>
          
          {/* Sri Ujjwal Reddy in center */}
          <div className="flex-1 flex items-center justify-center px-2">
            <h1 className="text-white font-bold text-2xl text-center leading-tight">Sri Ujjwal Reddy</h1>
          </div>
          
          {/* Software Engineer at bottom right */}
          <div className="absolute bottom-3 right-3">
            <p className="text-white/80 font-bold text-xl">Software Engineer</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 