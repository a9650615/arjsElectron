// const { ...THREE } = require('three');
// const GLTFLoader = require('three-gltf-loader');
//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////
// init model loader
let aniMixer = null;
const modelLoader = new THREE.GLTFLoader();
// modelLoader.load('https://firebasestorage.googleapis.com/v0/b/arcorecloud-246504.appspot.com/o/fantancy_book.glb?alt=media&token=02f9e6f0-eaf8-4ee5-b23d-4b1b6614853',
modelLoader.load('https://a9650615.github.io/arjsElectron/data/scene.glb',
  ( gltf ) => {
    aniMixer = new THREE.AnimationMixer( gltf.scene );
    if (gltf.animations[0]) {
      const action = aniMixer.clipAction(gltf.animations[0]);
      action.play();
    }
    gltf.scene.scale.set(0.009,0.009,0.009) // scale here
    markerRoot.add(gltf.scene);
    // scene.add( gltf.scene );
  },
  ( xhr ) => {
    // called while loading is progressing
    console.log( `${( xhr.loaded / xhr.total * 100 )}% loaded` );
  },
  ( error ) => {
    // called when loading has errors
    console.error( 'An error happened', error );
  }
)

var videoSelect = document.querySelector("select#videoSource");
var selectors = [videoSelect];

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  var values = selectors.map(function(select) {
    return select.value;
  });
  selectors.forEach(function(select) {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });

  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement("option");
    option.value = deviceInfo.deviceId;

    if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || "camera " + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    } else {
      console.log("Some other kind of source/device: ", deviceInfo);
    }

    selectors.forEach(function(select, selectorIndex) {
      if (
        Array.prototype.slice.call(select.childNodes).some(function(n) {
          return n.value === values[selectorIndex];
        })
      ) {
        select.value = values[selectorIndex];
      }
    });
  }
}

navigator.mediaDevices
  .enumerateDevices()
  .then(gotDevices)
  .catch(handleError);

function gotStream(stream) {
  arToolkitSource.domElement.srcObject = stream; // make stream available to console
  // video.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
  var videoSource = videoSelect.value;
  var constraints = {
    video: {
      deviceId: videoSource ? { exact: videoSource } : undefined
    }
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .then(gotDevices)
    .catch(handleError);
}

videoSelect.onchange = start;

function handleError(error) {
  console.log("navigator.getUserMedia error: ", error);
}

start();

// init renderer
var renderer	= new THREE.WebGLRenderer({
  // antialias	: true,
	alpha: true,
	precision: 'mediump',
	logarithmicDepthBuffer: true,
	preserveDrawingBuffer: true
});
// renderer.shadowMap.type = THREE.BasicShadowMap
// renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.shadowMap.enabled = true;
// renderer.toneMapping = THREE.ACESFilmicToneMapping
// gltf
renderer.gammaOutput = true;
renderer.gammaFactor = 2;
	// renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setPixelRatio( 1/1.5 );
	renderer.setSize(
		window.innerWidth < 1080? 1080: window.innerWidth,
		window.innerHeight < 720? 720: window.innerHeight );
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	window.document.body.appendChild( renderer.domElement ); // todo: FIX
	// array of functions for the rendering loop
	var onRenderFcts= [];
	// init scene and camera
	var scene	= new THREE.Scene();
	var ambient = new THREE.AmbientLight( 0x666666 );
	scene.add( ambient );
	var directionalLight = new THREE.DirectionalLight( 'white' );
	directionalLight.position.set( 1, 2, 0.3 ).setLength(2)
	directionalLight.shadow.mapSize.set(128,128)
	directionalLight.shadow.camera.bottom = -0.6
	directionalLight.shadow.camera.top = 0.6
	directionalLight.shadow.camera.right = 0.6
	directionalLight.shadow.camera.left = -0.6
	directionalLight.castShadow = true;
	// scene.add(new THREE.CameraHelper( directionalLight.shadow.camera ))
	scene.add( directionalLight );
	//////////////////////////////////////////////////////////////////////////////////
	//		Initialize a basic camera
	//////////////////////////////////////////////////////////////////////////////////
	// Create a camera
	var camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 20 );
	scene.add(camera);
	////////////////////////////////////////////////////////////////////////////////
	//          handle arToolkitSource
	////////////////////////////////////////////////////////////////////////////////
	var arToolkitSource = new THREEx.ArToolkitSource({
		// to read from the webcam
		sourceType : 'webcam',
		// to read from an image
		// sourceType : 'image',
		// sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',
		// to read from a video
		// sourceType : 'video',
		// sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
	})
	arToolkitSource.init(function onReady(){
		onResize()
	})
	
	// handle resize
	window.addEventListener('resize', function(){
		onResize()
	})
	function onResize(){
		arToolkitSource.onResizeElement()	
		arToolkitSource.copyElementSizeTo(renderer.domElement)	
		if( arToolkitContext.arController !== null ){
			arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)	
		}	
	}
	////////////////////////////////////////////////////////////////////////////////
	//          initialize arToolkitContext
	////////////////////////////////////////////////////////////////////////////////
	// create atToolkitContext
	var arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: THREEx.ArToolkitContext.baseURL + './data/camera_para.dat',
		// detectionMode: 'mono',
    // detectionMode: 'mono_and_matrix',
		detectionMode: 'color_and_matrix',
    // debug: true,
		// maxDetectionRate: 30,
		// canvasWidth: 80*3,
		// canvasHeight: 60*3,
	})
	// initialize it
	arToolkitContext.init(function onCompleted(){
		// copy projection matrix to camera
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	})
	// update artoolkit on every frame
	onRenderFcts.push(function(){
		if( arToolkitSource.ready === false )	return
		arToolkitContext.update( arToolkitSource.domElement )
		
		// update scene.visible if the marker is seen
		scene.visible = camera.visible
	})
	////////////////////////////////////////////////////////////////////////////////
	//          Create a ArMarkerControls
	////////////////////////////////////////////////////////////////////////////////
	var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
		type : 'pattern',
		// patternUrl : THREEx.ArToolkitContext.baseURL + './data/patt.hiro',
		patternUrl : THREEx.ArToolkitContext.baseURL + './data/baojing-pattern.patt',
		// patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
		// as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
		changeMatrixMode: 'cameraTransformMatrix'
	})
	// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
	scene.visible = false
	//////////////////////////////////////////////////////////////////////////////////
	//		add an object in the scene
	//////////////////////////////////////////////////////////////////////////////////
	var markerRoot = new THREE.Group
	scene.add(markerRoot)
	
	// add a torus knot
	// var geometry	= new THREE.CubeGeometry(1,1,1);
	// var material	= new THREE.MeshNormalMaterial({
	// 	transparent : true,
	// 	opacity: 0.5,
	// 	side: THREE.DoubleSide
	// });
	// var mesh	= new THREE.Mesh( geometry, material );
	// mesh.position.y	= geometry.parameters.height/2
	// markerRoot.add( mesh );
	;(function(){
		var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16); // make it slightly larger for better view
		var material	= new THREE.MeshNormalMaterial();
		var material	= new THREE.MeshLambertMaterial();
		var mesh	= new THREE.Mesh( geometry, material );
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.position.y	= 0.7
		// markerRoot.add( mesh );
		// point the directionalLight to the marker
		directionalLight.target = mesh
		onRenderFcts.push(function(){
			// mesh.rotation.x += 0.04;
		})
		// add a transparent ground-plane shadow-receiver
		var material = new THREE.ShadowMaterial();
		material.opacity = 0.7; //! bug in threejs. can't set in constructor
		var geometry = new THREE.PlaneGeometry(3, 3)
		var planeMesh = new THREE.Mesh( geometry, material);
		planeMesh.receiveShadow = true;
		planeMesh.depthWrite = false;
		planeMesh.rotation.x = -Math.PI/2
		markerRoot.add(planeMesh);
	})()
	//////////////////////////////////////////////////////////////////////////////////
	//		render the whole thing on the page
	//////////////////////////////////////////////////////////////////////////////////
	var stats = new Stats();
	window.document.body.appendChild( stats.dom ); // TodoL FIX
	// render the scene
	onRenderFcts.push(function(){
		renderer.render( scene, camera );
		stats.update();
	})
	// run the rendering loop
	var lastTimeMsec= null
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
    requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
    lastTimeMsec	= nowMsec
    if (aniMixer) {
      aniMixer.update(deltaMsec/1000);
    }
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
		})
  })
  