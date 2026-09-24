import React from "react";
import "../../css/vedio.css";
import { vedio, vedio2 } from "../../assets";

const Vedio = () => {
  return (
    <div className="video-container">
      <video
        className="video-player"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={vedio2} type="video/mp4" />
      </video>

      
    </div>
  );
};

export default Vedio;