export const fruitsModels = [
  { model: "banana/Banana_01", material: "banana/Banana_01", name: "banana" },
  { model: "apple/Apple_01", material: "apple/Apple_01", name: "apple" },
  {
    model: "bomb/bomb",
    material: "bomb/bomb",
    name: "bomb",
  },
];

export const commonFruitProperties = {
  soundPlayed: false,
  direction: "up",
  hit: false,
  speed: 6,
  banana: {
    thresholdTopY: 200,
  },
  bomb: {
    thresholdTopY: 150,
  },
  apple: {
    thresholdTopY: 150,
  },
};

export const trailOptions = {
  headRed: 1.0,
  headGreen: 0.0,
  headBlue: 1.0,
  headAlpha: 0.75,
  tailRed: 0.0,
  tailGreen: 1.0,
  tailBlue: 1.0,
  tailAlpha: 0.35,
  trailLength: 7,
  textureTileFactorS: 10.0,
  textureTileFactorT: 0.8,
  dragTexture: false,
  depthWrite: false,
};

export const scoreDivContent = document.getElementsByClassName(
  "score-number"
)[0];
export const canvas = document.getElementById("output");
export const flipHorizontal = false;

let hitScore = 0;

export var newFruitSound;
export var fruitSliced;
export var bombSlicedSound;
export var backgroundNoise;

export const losePoint = () => {
  hitScore += 1;
  document.getElementsByClassName(
    "score-number"
  )[1].innerHTML = `${hitScore}/3`;

  hitScore === 3 && endGame();
};

export const endGame = () => {
  document.getElementsByClassName("game-over")[0].style.display = "flex";
  cancelAnimationFrame(frameLoop);
};

export const generateRandomPosition = (min, max) =>
  Math.round(Math.random() * (max - min)) + min;

const isAndroid = () => /Android/i.test(navigator.userAgent);

const isiOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

export const isMobile = () => isAndroid() || isiOS();

export const updateStartButton = () => {
  document.getElementsByTagName("button")[0].innerText = "Start";
  document.getElementsByTagName("button")[0].disabled = false;
};

export const initSounds = () => {
  newFruitSound = new Howl({ src: ["../assets/fruit.m4a"] });
  fruitSliced = new Howl({ src: ["../assets/splash.m4a"] });
  bombSlicedSound = new Howl({ src: ["../assets/bomb-sound.m4a"] });
  backgroundNoise = new Howl({
    src: ["../assets/background-noise.m4a"],
    loop: true,
  });
};

var net;
var handMesh;
var video;

export var hand;

export const loadPoseNet = async () => {
  net = await posenet.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: 513,
    multiplier: 0.75,
  });

  video = await loadVideo();

  guiState.net = net;
  video && detectPoseInRealTime(video);
};

export const guiState = {
  algorithm: "single-pose",
  input: {
    mobileNetArchitecture: "0.75",
    outputStride: 16,
    imageScaleFactor: 0.5,
  },
  singlePoseDetection: {
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  },
  output: {
    showVideo: false,
    showPoints: true,
  },
  net: null,
};

const loadVideo = async () => {
  const video = await setupCamera();
  video.play();
  return video;
};

const setupCamera = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  const video = document.getElementById("video");
  video.width = window.innerWidth;
  video.height = window.innerHeight;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });
  video.srcObject = stream;

  return new Promise(
    (resolve) => (video.onloadedmetadata = () => resolve(video))
  );
};

// --------------------
// REAL TIME DETECTION
// --------------------

const detectPoseInRealTime = async (video) => {
  async function poseDetectionFrame() {
    const imageScaleFactor = guiState.input.imageScaleFactor;
    const outputStride = +guiState.input.outputStride;

    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;
    switch (guiState.algorithm) {
      case "single-pose":
        const pose = await guiState.net.estimateSinglePose(
          video,
          imageScaleFactor,
          flipHorizontal,
          outputStride
        );
        poses.push(pose);

        minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
        minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;
        break;
    }
    poses.forEach(({ score, keypoints }) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          const leftWrist = keypoints.find((k) => k.part === "leftWrist");
          const rightWrist = keypoints.find((k) => k.part === "rightWrist");

          if (!hand) {
            if (rightWrist || leftWrist) {
              handMesh = draw3DHand();
              hand = {
                mesh: handMesh,
                coordinates: rightWrist
                  ? rightWrist.position
                  : leftWrist.position,
                name: rightWrist ? "rightHand" : "leftHand",
              };
              scene && scene.add(handMesh);
            }
          } else {
            hand.coordinates =
              hand.name === "rightHand"
                ? rightWrist.position
                : leftWrist.position;
          }
        }
      }
    });
    requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
};

var camera, renderer;
var randomXPosition;
var randomYPosition;
var cameraZPosition;
const fruitsObjects = [];
const fruits = [];
var fruitModel;
let lastTrailUpdateTime = performance.now();
const gameOver = false;
let score = 0;

// Trails
var trailTarget,
  trailMaterial,
  trail,
  trailHeadGeometry,
  baseTrailMaterial,
  texturedTrailMaterial,
  circlePoints;

export var frameLoop;
export var scene;
export var camera;

export const initScene = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  cameraZPosition = 300;
  camera.position.set(0, 0, cameraZPosition);
  scene.add(camera);
};

export const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  let rendererContainer = document.getElementsByClassName("game")[0];
  rendererContainer.appendChild(renderer.domElement);
};

export const initLights = () => {
  let ambientLight = new THREE.AmbientLight(
    new THREE.Color("rgb(255,255,255)")
  );
  ambientLight.position.set(10, 0, 50);
  scene.add(ambientLight);

  let pointLight = new THREE.PointLight(0xffffff, 2, 1000, 1);
  pointLight.position.set(0, 40, 0);
  scene.add(pointLight);
};

export const loadFruitsModels = () => {
  return fruitsModels.map((fruit) => {
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath("../assets/");
    mtlLoader.load(`${fruit.material}.mtl`, function (materials) {
      materials.preload();

      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath("../assets/");
      objLoader.load(`${fruit.model}.obj`, function (object) {
        object.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            var mesh = new THREE.Mesh(child.geometry, child.material);
            fruitModel = mesh;
            fruitModel.name = fruit.name;
            fruits.push(fruitModel);
          }
        });

        if (fruits.length === fruitsModels.length) {
          generateFruits(1);
        }
      });
    });

    return fruits;
  });
};

export const generateFruits = (numFruits) => {
  for (var i = 0; i < numFruits; i++) {
    const randomFruit = fruits[generateRandomPosition(0, 2)];
    let newFruit = randomFruit.clone(); // Why are we cloning?

    switch (newFruit.name) {
      case "apple":
        randomXPosition = generateRandomPosition(
          -120 * camera.aspect,
          120 * camera.aspect
        );
        randomYPosition = generateRandomPosition(-290, -190);
        newFruit.position.set(randomXPosition, randomYPosition, 100);
        newFruit.thresholdBottomY = randomYPosition;
        break;
      case "banana":
        randomXPosition = generateRandomPosition(
          -200 * camera.aspect,
          200 * camera.aspect
        );
        randomYPosition = generateRandomPosition(-370, -270);
        newFruit.position.set(randomXPosition, randomYPosition, 0);
        newFruit.thresholdBottomY = randomYPosition;
        break;
      case "bomb":
        randomXPosition = generateRandomPosition(
          -110 * camera.aspect,
          110 * camera.aspect
        );
        randomYPosition = generateRandomPosition(-290, -190);
        newFruit.position.set(randomXPosition, randomYPosition, 100);
        newFruit.scale.set(20, 20, 20);
        newFruit.thresholdBottomY = randomYPosition;
        break;
      default:
        break;
    }

    newFruit.index = fruitsObjects.length;
    newFruit.thresholdTopY = commonFruitProperties[newFruit.name].thresholdTopY;
    newFruit.soundPlayed = commonFruitProperties.soundPlayed;
    newFruit.direction = commonFruitProperties.direction;
    newFruit.hit = commonFruitProperties.hit;
    newFruit.speed = commonFruitProperties.speed;

    fruitsObjects.push(newFruit);

    scene.add(newFruit);
    render();
  }
};

export const render = () => renderer && renderer.render(scene, camera);

// -----------
// TRAIL STUFF
// -----------

export const initSceneGeometry = (onFinished) => {
  initTrailHeadGeometries();
  initTrailTarget();

  onFinished && onFinished();
};

const initTrailHeadGeometries = () => {
  circlePoints = [];
  var twoPI = Math.PI * 2;
  var index = 0;
  var scale = 10.0;
  var inc = twoPI / 32.0;

  for (var i = 0; i <= twoPI + inc; i += inc) {
    var vector = new THREE.Vector3();
    vector.set(Math.cos(i) * scale, Math.sin(i) * scale, 0);
    circlePoints[index] = vector;
    index++;
  }
};

const initTrailTarget = () => {
  var geometry = new THREE.CircleGeometry(5, 32);
  var material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  trailTarget = new THREE.Mesh(geometry, material);
  // -500 to place it offscreen at first
  trailTarget.position.set(0, -500, 0);
  trailTarget.scale.multiplyScalar(1);
  trailTarget.receiveShadow = false;
  scene.add(trailTarget);
};

export const initTrailRenderers = (callback) => {
  trail = new THREE.TrailRenderer(scene, false);

  baseTrailMaterial = THREE.TrailRenderer.createBaseMaterial();

  var textureLoader = new THREE.TextureLoader();
  textureLoader.load("../assets/sparkle4.jpg", function (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;

    texturedTrailMaterial = THREE.TrailRenderer.createTexturedMaterial();
    texturedTrailMaterial.uniforms.texture.value = tex;

    continueInitialization();
    callback && callback();
  });

  const continueInitialization = () => {
    trailHeadGeometry = circlePoints;
    trailMaterial = baseTrailMaterial;
    initializeTrail();
  };
};

const initializeTrail = () => {
  trail.initialize(
    trailMaterial,
    Math.floor(trailOptions.trailLength),
    trailOptions.dragTexture ? 1.0 : 0.0,
    0,
    trailHeadGeometry,
    trailTarget
  );
  updateTrailColors();
  updateTrailTextureTileSize();
  trailMaterial.depthWrite = trailOptions.depthWrite;
  trail.activate();
};

const updateTrailTextureTileSize = () => {
  trailMaterial.uniforms.textureTileFactor.value.set(
    trailOptions.textureTileFactorS,
    trailOptions.textureTileFactorT
  );
};

const updateTrailColors = () => {
  trailMaterial.uniforms.headColor.value.set(
    trailOptions.headRed,
    trailOptions.headGreen,
    trailOptions.headBlue,
    trailOptions.headAlpha
  );
  trailMaterial.uniforms.tailColor.value.set(
    trailOptions.tailRed,
    trailOptions.tailGreen,
    trailOptions.tailBlue,
    trailOptions.tailAlpha
  );
};

export const draw3DHand = () => {
  const geometry = new THREE.BoxGeometry(7, 7, 7);
  const material = new THREE.MeshPhongMaterial({
    transparent: true,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = 0;
  return mesh;
};

// ----------
// SCENE UTILS
// ----------

export const animate = () => {
  frameLoop = requestAnimationFrame(animate);

  var time = performance.now();
  trailTarget && updateTrailTarget(time);

  if (fruitsObjects) {
    fruitsObjects.map((fruit) => {
      fruit.rotation.x += 0.1;
      fruit.rotation.y += 0.1;

      fruit.direction === "up" && (fruit.position.y += fruit.speed);

      if (
        fruit.position.y > fruit.thresholdBottomY &&
        !fruit.soundPlayed &&
        fruit.direction === "up"
      ) {
        fruit.name === "bomb" ? bombSlicedSound.play() : newFruitSound.play();
        fruit.soundPlayed = true;
      }

      fruit.position.y > fruit.thresholdTopY && (fruit.direction = "down");

      fruit.direction === "down" && (fruit.position.y -= fruit.speed);

      if (
        fruit.position.y < fruit.thresholdBottomY &&
        fruit.direction === "down"
      ) {
        scene.remove(fruit);
        fruitsObjects.splice(fruit.index, 1);
        fruit.name !== "bomb" && losePoint();
        !gameOver && generateFruits(1);
      }
    });
  }

  if (hand) {
    let hasCollided = animateHandTrail(hand, camera, fruitsObjects);

    if (hasCollided) {
      score += 1;
      scoreDivContent.innerHTML = score;
      fruitSliced.play();
    }
  }

  render();
};

const updateTrailTarget = (function updateTrailTarget() {
  var tempRotationMatrix = new THREE.Matrix4();
  var tempTranslationMatrix = new THREE.Matrix4();

  return function updateTrailTarget(time) {
    if (time - lastTrailUpdateTime > 10) {
      trail.advance();
      lastTrailUpdateTime = time;
    } else {
      trail.updateHead();
    }

    tempRotationMatrix.identity();
    tempTranslationMatrix.identity();
  };
})();

const animateHandTrail = (hand, camera, fruitsObjects) => {
  const handVector = new THREE.Vector3();
  // the x coordinates seem to be flipped so i'm subtracting them from window innerWidth
  handVector.x =
    ((window.innerWidth - hand.coordinates.x) / window.innerWidth) * 2 - 1;
  handVector.y = -(hand.coordinates.y / window.innerHeight) * 2 + 1;
  handVector.z = 0;

  handVector.unproject(camera);
  const cameraPosition = camera.position;
  const dir = handVector.sub(cameraPosition).normalize();
  const distance = -cameraPosition.z / dir.z;
  const newPos = cameraPosition.clone().add(dir.multiplyScalar(distance));

  hand.mesh.position.copy(newPos);
  hand.mesh.position.z = 0;

  trailTarget.position.set(handVector.x, handVector.y, 150);

  let handGeometry = hand.mesh.geometry;
  var originPoint = hand.mesh.position.clone();

  for (
    var vertexIndex = 0;
    vertexIndex < handGeometry.vertices.length;
    vertexIndex++
  ) {
    var localVertex = handGeometry.vertices[vertexIndex].clone();
    var globalVertex = localVertex.applyMatrix4(hand.mesh.matrix);
    var directionVector = globalVertex.sub(hand.mesh.position);

    var ray = new THREE.Raycaster(
      originPoint,
      directionVector.clone().normalize()
    );

    var collisionResults = ray.intersectObjects(fruitsObjects);

    if (collisionResults.length > 0) {
      if (collisionResults[0].distance < 200) {
        if (collisionResults[0].object.hit === false) {
          collisionResults[0].object.hit = true;
          collisionResults[0].object.name === "bomb" && endGame();
          scene.remove(collisionResults[0].object);
          fruitsObjects.splice(collisionResults[0].object.index, 1);
          !gameOver && generateFruits(1);
          return true;
        }
      }
    }
  }
  return false;
};

export const resetCamera = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  camera.position.set(0, 0, cameraZPosition);
  camera.lookAt(scene.position);
  renderer.setSize(window.innerWidth, window.innerHeight);
};
