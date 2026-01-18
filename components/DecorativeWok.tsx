'use client'

export function DecorativeWok() {
    return (
        <div className="relative w-full max-w-lg mx-auto pointer-events-none select-none">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />

            <svg
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 w-full h-auto drop-shadow-2xl"
            >
                {/* Steam Elements */}
                <g className="animate-pulse" style={{ animationDuration: '4s' }}>
                    <path
                        d="M80 50C85 40 75 30 80 20"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-primary/40"
                    >
                        <animate
                            attributeName="d"
                            values="M80 50C85 40 75 30 80 20;M82 45C87 35 77 25 82 15;M80 50C85 40 75 30 80 20"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </path>
                    <path
                        d="M100 45C105 35 95 25 100 15"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-primary/60"
                    >
                        <animate
                            attributeName="d"
                            values="M100 45C105 35 95 25 100 15;M102 40C107 30 97 20 102 10;M100 45C105 35 95 25 100 15"
                            dur="5s"
                            repeatCount="indefinite"
                        />
                    </path>
                    <path
                        d="M120 50C125 40 115 30 120 20"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-primary/40"
                    >
                        <animate
                            attributeName="d"
                            values="M120 50C125 40 115 30 120 20;M122 45C127 35 117 25 122 15;M120 50C125 40 115 30 120 20"
                            dur="6s"
                            repeatCount="indefinite"
                        />
                    </path>
                </g>

                {/* Wok Body */}
                <path
                    d="M40 100C40 133.137 66.8629 160 100 160C133.137 160 160 133.137 160 100H40Z"
                    fill="url(#wokGradient)"
                    className="drop-shadow-lg"
                />
                <path
                    d="M40 100C40 105.523 66.8629 110 100 110C133.137 110 160 105.523 160 100"
                    stroke="white"
                    strokeOpacity="0.2"
                    strokeWidth="2"
                />

                {/* Wok Handle */}
                <rect
                    x="160"
                    y="95"
                    width="40"
                    height="10"
                    rx="5"
                    fill="#333"
                    transform="rotate(-20 160 95)"
                />

                {/* Gradients */}
                <defs>
                    <linearGradient id="wokGradient" x1="40" y1="100" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--primary)" />
                        <stop offset="1" stopColor="#000" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Spice Particles */}
            <div className="absolute inset-0">
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-primary/40 rounded-full blur-[1px] animate-ping"
                        style={{
                            width: Math.random() * 6 + 2 + 'px',
                            height: Math.random() * 6 + 2 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animationDelay: Math.random() * 5 + 's',
                            animationDuration: Math.random() * 3 + 2 + 's',
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
