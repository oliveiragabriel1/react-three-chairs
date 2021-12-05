import React, {
  useRef,
  useEffect,
  useState,
  Suspense,
  createRef,
  useContext,
  createContext,
} from "react";
import "./App.scss";

//
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useProgress, useGLTF } from "@react-three/drei";
import lerp from "lerp";
// React Spring
import { a, useTransition } from "@react-spring/web";
//Intersection Observer
import { useInView } from "react-intersection-observer";

function Model({ url }) {
  const gltf = useGLTF(url, true);
  return <primitive object={gltf.scene} dispose={null} />;
}

// states
const state = {
  sections: 3,
  pages: 3,
  zoom: 1,
  top: createRef(),
};

//section

const offsetContext = createContext(0);

function Section({ children, offset, factor, ...props }) {
  const { offset: parentOffset, sectionHeight, aspect } = useSection();
  const ref = useRef();
  offset = offset !== undefined ? offset : parentOffset;
  useFrame(() => {
    const curY = ref.current.position.y;
    const curTop = state.top.current / aspect;
    ref.current.position.y = lerp(curY, (curTop / state.zoom) * factor, 0.1);
  });
  return (
    <offsetContext.Provider value={offset}>
      <group {...props} position={[0, -sectionHeight * offset * factor, 0]}>
        <group ref={ref}>{children}</group>
      </group>
    </offsetContext.Provider>
  );
}

function useSection() {
  const { sections, pages, zoom } = state;
  const { size, viewport } = useThree();
  const offset = useContext(offsetContext);
  const viewportWidth = viewport.width;
  const viewportHeight = viewport.height;
  const canvasWidth = viewportWidth / zoom;
  const canvasHeight = viewportHeight / zoom;
  const mobile = size.width < 700;
  const margin = canvasWidth * (mobile ? 0.2 : 0.1);
  const contentMaxWidth = canvasWidth * (mobile ? 0.8 : 0.6);
  const sectionHeight = canvasHeight * ((pages - 1) / (sections - 1));
  const aspect = size.height / viewportHeight;
  return {
    aspect,
    viewport,
    offset,
    viewportWidth,
    viewportHeight,
    canvasWidth,
    canvasHeight,
    mobile,
    margin,
    contentMaxWidth,
    sectionHeight,
  };
}
const Lights = () => {
  return (
    <>
      {/* Ambient Light illuminates lights for all objects */}
      <ambientLight intensity={0.3} />
      {/* Diretion light */}
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight
        castShadow
        position={[0, 10, 0]}
        intensity={1.5}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Spotlight Large overhead light */}
      <spotLight intensity={1} position={[1000, 0, 0]} castShadow />
    </>
  );
};

const HTMLContent = ({
  domContent,
  children,
  bgColor,
  modelPath,
  position,
}) => {
  const ref = useRef();
  useFrame(() => (ref.current.rotation.y += 0.01));
  const [refItem, inView] = useInView({
    threshold: 0,
  });
  useEffect(() => {
    inView && (document.body.style.background = bgColor);
  }, [inView]);
  return (
    <Section factor={1.5} offset={1}>
      <group position={[0, position, 0]}>
        <mesh ref={ref} position={[0, -35, 0]}>
          <Model url={modelPath} />
        </mesh>
        <Html fullscreen portal={domContent}>
          <div ref={refItem} className="container">
            <h1 className="title">{children}</h1>
          </div>
        </Html>
      </group>
    </Section>
  );
};

function Loader() {
  const { active, progress } = useProgress();
  const transition = useTransition(active, {
    from: { opacity: 1, progress: 0 },
    leave: { opacity: 0 },
    update: { progress },
  });
  return transition(
    ({ progress, opacity }, active) =>
      active && (
        <a.div className="loading" style={{ opacity }}>
          <div className="loading-bar-container">
            <a.div className="loading-bar" style={{ width: progress }}></a.div>
          </div>
        </a.div>
      )
  );
}

export default function App() {
  const [events, setEvents] = useState();
  const domContent = useRef();
  const scrollArea = useRef();
  const onScroll = (e) => (state.top.current = e.target.scrollTop);
  useEffect(() => void onScroll({ target: scrollArea.current }), []);

  return (
    <>
      <Canvas
        concurrent
        colorManagement
        camera={{ position: [0, 0, 120], fov: 70 }}
      >
        {/* Lights Component */}
        <Lights />
        <Suspense fallback={null}>
          <HTMLContent
            domContent={domContent}
            bgColor="#f15946"
            modelPath="/armchairYellow.gltf"
            position={250}
          >
            <span>Meet the new </span>
            <span>shopping experience </span>
            <span>for online chairs</span>
          </HTMLContent>
          <HTMLContent
            domContent={domContent}
            bgColor="#571ec1"
            modelPath="/armchairGreen.gltf"
            position={0}
          >
            <span>Shit... we even</span>
            <span>got different colors</span>
          </HTMLContent>
          <HTMLContent
            domContent={domContent}
            bgColor="#636567"
            modelPath="/armchairGray.gltf"
            position={-250}
          >
            <span>And yes</span>
            <span>we even got</span>
            <span>monochrome!</span>
          </HTMLContent>
        </Suspense>
      </Canvas>
      <Loader />
      <div
        className="scrollArea"
        ref={scrollArea}
        onScroll={onScroll}
        {...events}
      >
        <div style={{ position: "sticky", top: 0 }} ref={domContent} />
        <div style={{ height: `${state.pages * 100}vh` }} />
      </div>
    </>
  );
}
