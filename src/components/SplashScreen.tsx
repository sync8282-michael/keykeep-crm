import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"drawing" | "filling" | "zooming" | "done">("drawing");

  useEffect(() => {
    // Phase 1: Drawing animation (1.5s)
    const fillTimer = setTimeout(() => setPhase("filling"), 1500);
    // Phase 2: Fill in colors (0.6s)
    const zoomTimer = setTimeout(() => setPhase("zooming"), 2100);
    // Phase 3: Zoom and fade out (0.8s)
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2900);

    return () => {
      clearTimeout(fillTimer);
      clearTimeout(zoomTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
        phase === "zooming" || phase === "done" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className={`transition-transform duration-700 ease-out ${
          phase === "zooming" ? "scale-[3]" : "scale-100"
        }`}
      >
        <svg
          width="438"
          height="111"
          viewBox="0 0 438 111"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[320px] md:w-[400px] h-auto"
        >
          {/* K */}
          <path
            d="M0 0.0199585C4.6315 0.199959 9.03 0.100015 13.655 0.0150146C13.698 10.3 13.668 20.59 13.5655 30.875C22.426 20.55 31.6795 10.565 40.5465 0.174988C46.2265 0.194988 51.906 0.14 57.5845 0C48.814 9.92 39.056 21.88 29.9685 31.26C35.91 38.84 42.202 48.305 47.79 56.295L59.2205 72.39L42.487 72.325C36.588 62.945 27.606 51.165 20.968 42.085C18.517 45.085 16.036 48.06 13.524 51.01C13.3425 58.095 13.2855 65.185 13.3525 72.275L0.0750122 72.3L0 0.0199585Z"
            className={`splash-path ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 400, strokeDashoffset: 400 }}
          />
          
          {/* e (first) */}
          <path
            d="M86.902 18.885C108.836 16.91 117.175 31.015 116.561 50.81C103.324 50.73 90.087 50.74 76.85 50.835C77.4045 52.305 78.1445 54.26 78.993 55.54C81.2115 58.9 84.6855 61.225 88.6355 62C95.436 63.355 101.24 61.13 106.809 57.53C109.169 60.75 110.747 62.48 113.506 65.4C88.7595 87.91 49.657 61.32 68.3525 30.2C72.484 23.32 79.4855 20.445 86.902 18.885Z"
            className={`splash-path ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 300, strokeDashoffset: 300, animationDelay: "0.1s" }}
          />
          <path
            d="M86.7975 30.38C96.5285 29.46 101.925 31.91 104.025 41.97L95.278 41.965L76.5215 41.865C76.6575 41.49 76.797 41.12 76.9395 40.755C79.3925 34.45 80.9325 32.965 86.7975 30.38Z"
            className={`splash-path-inner ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 150, strokeDashoffset: 150, animationDelay: "0.15s" }}
          />
          
          {/* y */}
          <path
            d="M165.227 19.395C169.541 19.785 174.782 19.655 179.181 19.66C172.361 35.81 165.562 53.765 159.405 70.175C152.539 87.41 145.85 98.105 125.239 88.38C126.874 84.885 128.228 81.34 129.64 77.755C137.259 81.365 140.994 82.07 144.953 73.93L123.028 19.56C127.579 19.645 132.131 19.64 136.682 19.555L137.028 19.67C139.03 22.25 149.261 51.65 151.247 57.085C152.534 54.3 154.476 48.265 155.643 45.145C158.894 36.585 162.089 28 165.227 19.395Z"
            className={`splash-path ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 350, strokeDashoffset: 350, animationDelay: "0.2s" }}
          />
          
          {/* K (second) */}
          <path
            d="M191.052 0.0999756C195.616 0.129976 200.181 0.129976 204.745 0.0999756L204.724 31.165C213.286 20.89 223.736 10.48 231.911 0.274963L248.786 0.224976C240.051 9.98998 230.066 22.095 221.161 31.27C227.171 39.155 233.241 47.955 239.051 56.055C242.971 61.51 246.931 66.93 250.931 72.325L234.261 72.29C229.376 64.26 218.246 50.02 212.336 42.31C209.776 45.595 207.571 48.365 204.801 51.465L204.695 72.34L191.197 72.325L191.052 0.0999756Z"
            className={`splash-path ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 400, strokeDashoffset: 400, animationDelay: "0.3s" }}
          />
          
          {/* e (second) */}
          <path
            d="M277.771 18.89C279.806 18.67 281.851 18.59 283.891 18.65C302.751 19.2 309.336 34.385 308.431 50.895C295.251 51.145 281.546 50.505 268.521 51.055C268.961 52.075 269.601 53.605 270.146 54.585C272.236 58.255 275.761 60.885 279.876 61.85C286.326 63.41 292.461 61.475 297.956 58.17L298.266 58.065C299.586 58.48 304.036 64.04 305.331 65.53C289.551 79 262.461 75.35 256.701 54.07C252.176 37.36 261.141 23.09 277.771 18.89Z"
            className={`splash-path ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 300, strokeDashoffset: 300, animationDelay: "0.4s" }}
          />
          <path
            d="M281.076 29.945C290.581 29.635 293.541 33.705 296.211 41.845H283.931L268.516 41.81C270.711 34.5 273.526 31.34 281.076 29.945Z"
            className={`splash-path-inner ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 150, strokeDashoffset: 150, animationDelay: "0.45s" }}
          />
          
          {/* e (third) */}
          <path
            d="M340.461 18.88C362.686 17.055 371.261 30.69 370.656 50.92C357.486 51.1 343.591 50.355 330.516 51.065C336.466 64.78 348.851 64.925 360.461 57.655C362.706 60.295 364.931 62.955 367.131 65.63C356.916 74.165 342.066 76.46 330.356 69.58C324.311 66.05 319.996 60.175 318.446 53.355C314.511 36.78 323.541 22.38 340.461 18.88Z"
            className={`splash-path ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 300, strokeDashoffset: 300, animationDelay: "0.5s" }}
          />
          <path
            d="M342.536 29.895C351.826 29.57 356.221 32.99 358.291 41.92L346.951 41.925L330.501 41.855C332.741 34.35 335.081 31.865 342.536 29.895Z"
            className={`splash-path-inner ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 150, strokeDashoffset: 150, animationDelay: "0.55s" }}
          />
          
          {/* p */}
          <path
            d="M408.026 18.89C424.151 17.235 435.556 26.745 437.301 42.625C439.896 66.27 416.176 83.79 396.071 66.46L396.056 72.675C395.936 78.56 396.041 104.4 396.071 110.3C391.681 110.3 387.021 110.315 382.736 110.3V19.8L395.641 19.785L395.681 26.625C399.931 21.73 401.896 20.77 408.026 18.89Z"
            className={`splash-path ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 400, strokeDashoffset: 400, animationDelay: "0.6s" }}
          />
          <path
            d="M408.591 30.435C427.726 30.655 430.031 58.625 410.806 61.675C393.291 62.23 389.106 34.7 408.591 30.435Z"
            className={`splash-path-inner ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 200, strokeDashoffset: 200, animationDelay: "0.65s" }}
          />
          
          {/* TM symbol */}
          <path
            d="M395.681 86.8188L411.668 86.8L411.681 91.6062L406.364 91.5521L406.393 96.0155L400.471 95.9756L400.479 100.455L406.398 100.434L406.364 104.7L411.646 104.665L411.668 110.3C406.385 110.3 401.218 110.3 395.681 110.3V86.8188Z"
            className={`splash-path ${phase === "filling" || phase === "zooming" ? "filled" : ""}`}
            style={{ strokeDasharray: 150, strokeDashoffset: 150, animationDelay: "0.7s" }}
          />
        </svg>
      </div>
      
      <style>{`
        .splash-path {
          fill: transparent;
          stroke: hsl(var(--primary));
          stroke-width: 1.5;
          animation: drawPath 1.2s ease-out forwards;
        }
        
        .splash-path-inner {
          fill: transparent;
          stroke: hsl(var(--muted-foreground));
          stroke-width: 1;
          animation: drawPath 1.2s ease-out forwards;
        }
        
        .splash-path.filled {
          fill: #1D2334;
          stroke: transparent;
          transition: fill 0.5s ease-out, stroke 0.3s ease-out;
        }
        
        .splash-path-inner.filled {
          fill: hsl(var(--background));
          stroke: transparent;
          transition: fill 0.5s ease-out, stroke 0.3s ease-out;
        }
        
        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}