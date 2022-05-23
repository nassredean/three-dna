import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GUI } from "dat.gui";

import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertexParticles.glsl";

import dna from "./assets/dna.glb";

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/"
    ); // use a full url path
    this.loader.setDRACOLoader(this.dracoLoader);

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.loader.load(dna, (gltf) => {
      this.geometry = gltf.scene.children[0].geometry;

      this.geometry.center();
      this.settings();

      this.addObjects();

      this.initPost();
      this.resize();
      this.setupResize();

      this.render();
    });
  }

  initPost() {
    this.renderScene = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.9,
      0.85
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.bloomPass);
  }

  settings() {
    this.settings = {
      progress: 0,
      bloomThreshold: 1.4,
      bloomStrength: 0.9,
      bloomRadius: 0.01,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "bloomThreshold", 0, 10, 0.01);
    this.gui.add(this.settings, "bloomStrength", 0, 10, 0.01);
    this.gui.add(this.settings, "bloomRadius", 0, 10, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        uColor1: { value: new THREE.Color(0x612574) },
        uColor2: { value: new THREE.Color(0x293583) },
        uColor3: { value: new THREE.Color(0x1954ec) },
        resolution: { type: "v4", value: new THREE.Vector4() },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.number = this.geometry.attributes.position.array.length;
    let sizeRnd = new Float32Array(this.number / 3);
    let colorRnd = new Float32Array(this.number / 3);

    for (let i = 0; i < sizeRnd.length; i++) {
      sizeRnd.set([Math.random()], i);
      colorRnd.set([Math.random()], i);
    }

    this.geometry.setAttribute(
      "sizeRnd",
      new THREE.BufferAttribute(sizeRnd, 1)
    );
    this.geometry.setAttribute(
      "colorRnd",
      new THREE.BufferAttribute(colorRnd, 1)
    );

    this.plane = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    if (this.bloomPass) {
      this.bloomPass.threshold = this.settings.bloomThreshold;
      this.bloomPass.strength = this.settings.bloomStrength;
      this.bloomPass.radius = this.settings.bloomRadius;
    }

    this.plane.rotation.y = this.time / 25;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
