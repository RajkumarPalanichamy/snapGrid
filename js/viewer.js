import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { Popup } from './popup.js';
import { Bodies } from './bodies.js';
import { UserInterface } from './userInterface.js';
import { Dimensions } from './dimensions.js';

let completeViewer = null;

function create() {
    completeViewer = new Viewer();
    completeViewer.ui = new UserInterface(completeViewer)
    completeViewer.createViewer();
    completeViewer.animate();
}
class Viewer {
    constructor() {
        this.camera = null;
        this.orbitControls = null;
        this.container = null;
        this.scene = null;
        this.lights = null;
        this.renderer = null;
        this.mouse = null;
        this.raycaster = null;
        this.widthO = 1600;
        this.heightO = 900;
        this.raycasterObject = [];
        this.overallWidth = null;
        this.overallHeight = null;
        this.overallDepth = null;
        this.overallDimensionValues = {};
        this.bodies = null
        this.mode2D = false
        this.position = new THREE.Vector3(0, 0, 0)
        this.target = new THREE.Vector3(0, 1, 0);
        this.plane = null;
        this.objectMaxSize = 0
        this.dimensions = null
        this.activeAxis = null;
        this.initialMouse = new THREE.Vector2();
        this.deltaMouse = new THREE.Vector2();
        this.size = 0
        this.division = 50
    }

    createViewer() {
        this.setupContainer();
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
        this.setupRayCaster();
        this.setupBodies();
        this.setupDimension();
        this.setupEventListeners();
    }

    setupContainer() {
        this.container = document.getElementById('three-container') || document.createElement('div');
        document.body.appendChild(this.container);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.setSize(this.widthO, this.heightO);
        this.container.appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("white");
        this.scene.fog = new THREE.Fog("white", 500, 2000);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, this.widthO / this.heightO, 10, 10000);
        this.scene.add(this.camera);
    }

    setupLights() {
        this.lights = new THREE.AmbientLight();
        this.scene.add(this.lights);

        const pointLight = new THREE.PointLight("white", 5, 0, 0.1);
        pointLight.position.set(100, 100, 300);
        pointLight.castShadow = true;
        this.scene.add(pointLight);
    }

    setupControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.setSpace('world');
        this.transformControls.size = 0.5;
       // this.transformControls.showZ = false;
        this.transformControls.setTranslationSnap(null);
        this.transformControls.setMode('translate');
        this.scene.add(this.transformControls);
    }

    setupRayCaster() {
        this.raycaster = new THREE.Raycaster();
    }

    setupPlane() {
        const planeWidth = 100000;
        const planeHeight = 100000;
        const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: "#ffffff",
        });

        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.receiveShadow = true;
        this.plane.position.y = -100;
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);
        this.updatePlanePosition()
    }

    updatePlanePosition() {
        const boundingBox = new THREE.Box3().setFromObject(this.bodies.frame);
        const minY = boundingBox.min.y - 5; // Slight offset to keep it below
        this.plane.position.y = minY;
    }

    setupBodies() {
        this.bodies = new Bodies(this);
    }

    setupDimension() {
        this.dimensions = new Dimensions(this);
    }

    setupEventListeners() {
        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
        window.addEventListener('resize', () => this.onWindowResize(), false);
        window.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
        window.addEventListener('pointermove', (event) => this.handlePointerMove(event));
        this.renderer.domElement.addEventListener("click", (event) => this.handleClickIfNeeded(event));
    }

    handlePointerDown(event) {
        this.initialMouse.set(event.clientX, event.clientY);
    }

    handlePointerMove(event) {
        this.deltaMouse.set(event.clientX - this.initialMouse.x, event.clientY - this.initialMouse.y);
    }

    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyG':
                this.transformControls.setMode('translate');
                break;
            case 'KeyR':
                this.transformControls.setMode('rotate');
                break;
            case 'KeyS':
                this.transformControls.setMode('scale');
                break;
        }
    }

    handleClickIfNeeded(event) {
        if (this.bodies.overallBodies.length > 0 || this.bodies.twoDObjects.length > 0) {
            this.handleClick(event);
        }
    }

    onWindowResize = () => {
        this.camera.aspect = this.widthO / this.heightO;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.widthO, this.heightO);
    };

    switchMode() {
        this.mode2D = !this.mode2D;

        if (this.mode2D) {
            this.enable2DMode();
        } else {
            this.enable3DMode();
        }
    }

    enable2DMode() {
        if (this.plane) {
            this.scene.remove(this.plane);
        }

        this.orbitControls.reset();
        if (this.transformControls) {
            this.scene.remove(this.transformControls);
            this.transformControls.detach();
        }

        this.objectMaxSize = Math.max(
            this.bodies.frame.geometry.parameters.width,
            this.bodies.frame.geometry.parameters.height
        );

        this.size = this.objectMaxSize * Math.abs(this.objectMaxSize / 20);
        let gridHelper = this.scene.getObjectByName('gridHelper');

        if (!gridHelper) {
            gridHelper = new THREE.GridHelper(this.size, this.division);
            gridHelper.name = 'gridHelper';
            this.bodies.addCornerPoints(this.bodies.frame)
            const ratio = this.size / this.division
            this.bodies.gridPercentage = (ratio * 5) / 100

            this.scene.add(gridHelper);
        }

        this.camera.position.set(0, this.objectMaxSize, 0);
        this.camera.lookAt(0, 0, 0);
        this.orbitControls.maxDistance = this.objectMaxSize + 300
        this.orbitControls.enabled = true;
        this.orbitControls.enableRotate = false;

        this.scene.remove(this.bodies.frame);
        this.bodies.overallBodies.forEach(child => this.scene.remove(child.mesh));
        this.bodies.generate2DDrawing();

        this.renderer.domElement.addEventListener("mouseenter", (event) => this.bodies.addDragControls(event));
    }

    enable3DMode() {
        this.scene.add(this.plane);
        this.bodies.points = []
        const gridHelper = this.scene.getObjectByName('gridHelper');
        const lineSegments = this.scene.getObjectByName('lineSegments');

        if (gridHelper) this.scene.remove(gridHelper);
        if (lineSegments) this.scene.remove(lineSegments);
        this.bodies.twoDObjects.forEach(mesh => {
            if (mesh.name.includes('segments')) {
                this.scene.remove(mesh);
            }
        });

        this.orbitControls.reset();
        this.orbitControls.enableRotate = true;
        this.scene.add(this.transformControls);

        this.camera.position.set(this.position.x, this.position.y, this.position.z);
        this.camera.lookAt(this.target.x, this.target.y, this.target.z);
        this.scene.add(this.bodies.frame);
        this.updateOverAllBodies();

        this.bodies.twoDObjects = [];
        this.bodies.innerObjects = []

        this.renderer.domElement.removeEventListener("mouseenter", (event) => this.bodies.addDragControls(event));
    }

    //removes circular dependecy of userdata
    updateOverAllBodies() {
        this.bodies.overallBodies.forEach(child => {
            const lineData = child.line.lineSegments;
            if (lineData) {
                const { position, scale, rotation } = lineData;
                child.mesh.position.set(position.x, -position.z, child.mesh.position.z);
                child.mesh.scale.copy(scale);
                child.mesh.rotation.z = -rotation.z;
            }
            this.scene.add(child.mesh);
        });
    }


    handleClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        this.raycaster.setFromCamera(mouse, this.camera);
        const spriteIntersects = this.raycaster.intersectObjects(this.bodies.spriteObjects, true);
        if (spriteIntersects.length > 0 && this.bodies.spriteObjects.includes(spriteIntersects[0].object)) {
            this.bodies.overallBodies.forEach((object)=>{ {
                if(object.sprite ===spriteIntersects[0].object) {
                    this.popup = new Popup(spriteIntersects[0].object,object.mesh, this, this.onSave.bind(this), this.onCancel.bind(this));
                    return; 
                }
                
            }
            })
           
        }
        if (this.mode2D) return;

        if (this.bodies.transformEnabled) {
            const objectsToCheck = this.bodies.overallBodies;
            const items = []
            objectsToCheck.forEach((item) => {
                items.push(item.mesh)
            });
            const objectIntersects = this.raycaster.intersectObjects(items, true);

            if (objectIntersects.length > 0) {
                this.handleObjectIntersection(objectIntersects[0].object);
            } else {
                this.resetTransformControls();
            }
        }
    }

    handleObjectIntersection(intersectedObject) {
        this.intersectedObject = intersectedObject;
        this.transformControls.detach();
        if (this.transformControls.mode === "scale") {
            this.transformControls.attach(this.bodies.pivot); // Attach to pivot when scaling
        } else {
            this.transformControls.attach(this.intersectedObject); // Attach to intersected object otherwise
        }

        // Add Gizmo Helper
        const gizmo = this.transformControls.getHelper();
        this.scene.add(gizmo);
        this.orbitControls.enabled = false;

        this.transformControls.addEventListener('objectChange', () => {
            if (this.transformControls.mode === 'scale') {
                this.dimensions.add3DDimensionsToRectangles(this.intersectedObject);
            }
            this.restrictDoorMovement(this.intersectedObject);
        });

        // Handle mouse up event (finalize scaling)
        this.transformControls.addEventListener('mouseUp', () => {
            if (this.transformControls.mode === 'scale') {
                if (this.intersectedObject && this.intersectedObject.parent === this.bodies.pivot) {
                    this.bodies.pivot.remove(this.intersectedObject);

                    const originalScale = this.intersectedObject.scale.clone();
                    const pivotScale = this.bodies.pivot.scale.clone();

                    // Apply scaling only on changed axes
                    const newScale = new THREE.Vector3(
                        pivotScale.x !== 1 ? originalScale.x * pivotScale.x : originalScale.x,
                        pivotScale.y !== 1 ? originalScale.y * pivotScale.y : originalScale.y,
                        pivotScale.z !== 1 ? originalScale.z * pivotScale.z : originalScale.z
                    );

                    // Apply pivot transformations
                    this.intersectedObject.applyMatrix4(this.bodies.pivot.matrixWorld);
                    this.intersectedObject.scale.copy(newScale);

                    // Reset pivot
                    this.bodies.pivot.position.set(0, 0, 0);
                    this.bodies.pivot.scale.set(1, 1, 1);
                    this.bodies.pivot.rotation.set(0, 0, 0);

                    this.scene.add(this.intersectedObject);
                }

                this.transformControls.detach();
                this.dimensions.removeDimensions();
            }
        });

        this.transformControls.addEventListener('mouseDown', () => {
            if (this.transformControls.mode === 'scale') {
                const box = new THREE.Box3().setFromObject(this.intersectedObject);
                this.bodies.pivot.position.set(0, 0, 5); // Ensure correct pivot positioning

                const scaleHandle = this.transformControls.axis;
                if (scaleHandle === 'Y') {
                    this.bodies.pivot.position.y = this.deltaMouse.y < 0 ? box.min.y : box.max.y;
                }
                if (scaleHandle === 'X') {
                    this.bodies.pivot.position.x = this.deltaMouse.x > 0 ? box.min.x : box.max.x;
                }

                this.orbitControls.enabled = false;
                this.bodies.pivot.attach(this.intersectedObject);
                this.transformControls.attach(this.bodies.pivot);
            } else {
                this.transformControls.attach(this.intersectedObject);
            }
        });
    }

    resetTransformControls() {
        this.transformControls.detach();
        this.orbitControls.enabled = true;
    }

    restrictDoorMovement(intersectedObject) {
        if (!this.overallDimensionValues) return;
        const modelBoundingBox = new THREE.Box3().setFromObject(intersectedObject);
        const boundaryBoundingBox = new THREE.Box3().setFromObject(this.bodies.frame);

        const restrictPosition = (position, halfDimension, rectangleHalf) => {
            return THREE.MathUtils.clamp(position, halfDimension, rectangleHalf);
        };

        if (
            boundaryBoundingBox.max.x < modelBoundingBox.max.x ||
            boundaryBoundingBox.min.x > modelBoundingBox.min.x ||
            boundaryBoundingBox.min.y > modelBoundingBox.min.y ||
            boundaryBoundingBox.max.y < modelBoundingBox.max.y
        ) {
            intersectedObject.position.x = restrictPosition(
                intersectedObject.position.x,
                boundaryBoundingBox.min.x + modelBoundingBox.getSize(new THREE.Vector3()).x / 2,
                boundaryBoundingBox.max.x - modelBoundingBox.getSize(new THREE.Vector3()).x / 2
            );
            intersectedObject.position.y = restrictPosition(
                intersectedObject.position.y,
                boundaryBoundingBox.min.y + modelBoundingBox.getSize(new THREE.Vector3()).y / 2,
                boundaryBoundingBox.max.y - modelBoundingBox.getSize(new THREE.Vector3()).y / 2
            );
            intersectedObject.position.z = this.overallDimensionValues.depth / 2;
        }
    }

    onSave() {
        this.bodies.showAllSprites()
    }

    onCancel() {
        this.bodies.showAllSprites()
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.bodies.spriteObjects.forEach(obj => {
            obj.quaternion.copy(this.camera.quaternion);
        });
        this.render();
        if (!this.mode2D) this.orbitControls.update();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

export { completeViewer, create };
