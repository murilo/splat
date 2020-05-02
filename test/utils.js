// bomb model https://poly.google.com/view/0mwBvcViY7P

const fruitsModels = [
  { model: "banana/Banana_01", material: "banana/Banana_01", name: "banana" },
  { model: "apple/Apple", material: "apple/Apple", name: "apple" },
  {
    model: "bomb/bomb",
    material: "bomb/bomb",
    name: "bomb",
  },
];

export const generateRandomXPosition = (min, max) =>
  Math.round(Math.random() * (max - min)) + min;

const isAndroid = () => /Android/i.test(navigator.userAgent);

const isiOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

export const isMobile = () => isAndroid() || isiOS();

export const draw3DHand = () => {
  const geometry = new THREE.BoxGeometry(10, 10, 10);
  const material = new THREE.MeshPhongMaterial({
    transparent: true,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = 0;
  return mesh;
};

export const moveHands = (hands, camera, fruitsObjects, event) => {
  return hands.map((hand) => {
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

    trailTarget.position.x = handVector.x;
    trailTarget.position.y = handVector.y;
    // trailTarget.position.z = 10;
    trailTarget.position.z = 150;
    // trailTarget.position.z = 200;

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
        // if (collisionResults[0].distance < 500) {
        // if (collisionResults[0].distance < 600) {
        if (collisionResults[0].distance < 800) {
          if (collisionResults[0].object.hit === false) {
            collisionResults[0].object.hit = true;
            console.log("you should come here once");

            collisionResults[0].object.name === "bomb" && losePoint();

            scene.remove(collisionResults[0].object);
            fruitsObjects.splice(collisionResults[0].object.index, 1);

            !gameOver && generateFruits(1);
            return true;
          }
        }
      }

      // if (
      //   collisionResults.length > 0 &&
      //   collisionResults[0].distance < directionVector.length()
      // ) {
      //   console.log("collisionnnn");
      // }
    }
    return false;
  });
};

export const losePoint = () => {
  if (hitScore >= 3) {
    // restart button
    // generate fruits
    gameOver = true;
    hitScore = 0;
    score = 0;
    cancelAnimationFrame(frameLoop);
  } else {
    hitScore += 1;
    document.getElementsByClassName(
      "score-number"
    )[1].innerHTML = `${hitScore}/3`;
  }
};

const resetCamera = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // camera.position.set(0, 200, 400);
  camera.position.set(0, 0, cameraZPosition);

  camera.lookAt(scene.position);
  renderer.setSize(window.innerWidth, window.innerHeight);
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

export const render = () => renderer.render(scene, camera);

export const updateStartButton = () => {
  document.getElementsByTagName("button")[0].innerText = "Start";
  document.getElementsByTagName("button")[0].disabled = false;
};

export const initTrailOptions = () => {
  options = {
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
};

const initTrailTarget = () => {
  var geometry = new THREE.CircleGeometry(5, 32);
  var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  trailTarget = new THREE.Mesh(geometry, material);
  trailTarget.position.set(0, 0, 0);
  trailTarget.scale.multiplyScalar(1);
  trailTarget.receiveShadow = false;

  scene.add(trailTarget);
};

const updateTrailColors = () => {
  trailMaterial.uniforms.headColor.value.set(
    options.headRed,
    options.headGreen,
    options.headBlue,
    options.headAlpha
  );
  trailMaterial.uniforms.tailColor.value.set(
    options.tailRed,
    options.tailGreen,
    options.tailBlue,
    options.tailAlpha
  );
};

const updateTrailTextureTileSize = () => {
  trailMaterial.uniforms.textureTileFactor.value.set(
    options.textureTileFactorS,
    options.textureTileFactorT
  );
};

const initializeTrail = () => {
  trail.initialize(
    trailMaterial,
    Math.floor(options.trailLength),
    options.dragTexture ? 1.0 : 0.0,
    0,
    trailHeadGeometry,
    trailTarget
  );
  updateTrailColors();
  updateTrailTextureTileSize();
  trailMaterial.depthWrite = options.depthWrite;
  trail.activate();
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

const loadVideo = async () => {
  const video = await setupCamera();
  video.play();

  return video;
};

export const initSounds = () => {
  newFruitSound = new Howl({ src: ["../assets/fruit.m4a"] });
  fruitSliced = new Howl({ src: ["../assets/splash.m4a"] });
  bombSlicedSound = new Howl({ src: ["../assets/bomb-sound.m4a"] });
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

export const loadPoseNet = async () => {
  net = await posenet.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: 513,
    multiplier: 0.75,
  });

  try {
    video = await loadVideo();
  } catch (e) {
    throw e;
  }

  guiState.net = net;
};

export const generateFruits = (numFruits) => {
  console.log("i come back here right");
  for (var i = 0; i < numFruits; i++) {
    const randomFruit = fruits[generateRandomXPosition(0, 2)];
    let newFruit = randomFruit.clone(); // Why are we cloning?

    switch (newFruit.name) {
      case "apple":
        randomXPosition = generateRandomXPosition(
          -400 * camera.aspect,
          400 * camera.aspect
        );
        randomYPosition = generateRandomXPosition(-720, -680);
        newFruit.position.set(randomXPosition, randomYPosition, -300);
        newFruit.thresholdBottomY = randomYPosition;
        newFruit.thresholdTopY = 180 * camera.aspect;
        newFruit.speed = 6;
        break;
      case "banana":
        randomXPosition = generateRandomXPosition(
          -200 * camera.aspect,
          200 * camera.aspect
        );
        randomYPosition = generateRandomXPosition(-300, -270);
        newFruit.position.set(randomXPosition, randomYPosition, 0);
        newFruit.thresholdBottomY = randomYPosition;
        newFruit.thresholdTopY = 80 * camera.aspect;
        newFruit.speed = 6;
        break;
      case "bomb":
        randomXPosition = generateRandomXPosition(
          -110 * camera.aspect,
          110 * camera.aspect
        );
        randomYPosition = generateRandomXPosition(-220, -190);
        newFruit.position.set(randomXPosition, randomYPosition, 100);

        newFruit.scale.set(20, 20, 20);
        newFruit.speed = 4;
        newFruit.thresholdBottomY = randomYPosition;
        newFruit.thresholdTopY = 60 * camera.aspect;
        break;
      default:
        break;
    }

    newFruit.soundPlayed = false;
    newFruit.direction = "up";
    newFruit.hit = false;
    newFruit.index = fruitsObjects.length;
    fruitsObjects.push(newFruit);

    scene.add(newFruit);
    renderer.render(scene, camera);
  }
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
          generateFruits(fruits.length);
        }
      });
    });

    return fruits;
  });
};

export const onWindowResize = () => {
  resetCamera();
  render();
};

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

export const initSceneGeometry = (onFinished) => {
  initTrailHeadGeometries();
  initTrailTarget();

  if (onFinished) {
    onFinished();
  }
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

    if (callback) {
      callback();
    }
  });

  function continueInitialization() {
    trailHeadGeometry = circlePoints;
    trailMaterial = baseTrailMaterial;
    initializeTrail();
  }
};
