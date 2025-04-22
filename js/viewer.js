import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { Popup } from './popup.js';
import { Bodies } from './bodies.js';
import { UserInterface } from './userInterface.js';
import { Dimensions } from './dimensions.js';
import { scaleModel } from './operations/scalingHelper.js';
import { rectColor } from './constants/color.js';
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
        this.widthO = 1500;
        this.heightO = 860;
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

        this.size = 0;
        this.isCtrlPressed = false;
        this.selectedSnap = {
            source: null,
            sourceObject: null,
            target: null,
            targetObject: null
        };

        this.size = 0
        this.rect = null
        this.temporaryScale = new THREE.Vector3(1, 1, 1)
        this.minBox = new THREE.Vector3(0, 0, 0)
        this.maxBox = new THREE.Vector3(0, 0, 0)
        this.lastMouseX = 0;
        this.offsetX = 1
        this.offsetY = 1
        this.offsetZ = 1
        this.previousScale = new THREE.Vector3(1, 1, 1)
        this.scalingDampeningFactor = 1;
        this.selectedMeshes = [];
        this.mouseDownValue = {
            position: new THREE.Vector3(0,0,0),
            scale: new THREE.Vector3(0,0,0),
           
        };
this.intersected = false
    }

    createViewer() {
        this.setupContainer();
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
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
        this.rect = this.renderer.domElement.getBoundingClientRect();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("white");
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, this.widthO / this.heightO, 10, 10000);
        this.scene.add(this.camera);
    }

    setupLights(z, depth) {
        const ambient = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambient);

        const frameBox = new THREE.Box3().setFromObject(this.bodies.frame);
        const frameSize = new THREE.Vector3();
        frameBox.getSize(frameSize);

        const maxHorizontal = Math.max(frameSize.z, frameSize.y);
        const distance = maxHorizontal;
        const height = frameSize.y;

        const frameCenter = new THREE.Vector3();
        new THREE.Box3().setFromObject(this.bodies.frame).getCenter(frameCenter);

        const directions = [
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0)
        ];

        directions.forEach(dir => {
            const spotLight = new THREE.SpotLight(0xffffff, 3);

            const lightPos = frameCenter.clone().add(dir.clone().multiplyScalar(distance));
            lightPos.y += height;
            spotLight.position.copy(lightPos);

            const target = frameCenter.clone();
            spotLight.target.position.copy(target);
            this.scene.add(spotLight.target);

            // Shadow settings
            spotLight.castShadow = true;
            spotLight.shadow.mapSize.width = 1024;
            spotLight.shadow.mapSize.height = 1024;
            spotLight.angle = Math.PI / 4;
            spotLight.penumbra = 0.5;
            spotLight.decay = 0;
            spotLight.shadow.focus = 1;
            spotLight.shadow.camera.near = 1;
            spotLight.shadow.camera.far = z + depth;
            spotLight.shadow.camera.fov = 75;
            const frameDiagonal = frameSize.length();
            spotLight.distance = frameDiagonal * 2;


            // Add to scene
            this.scene.add(spotLight);
        });
    }


    setupControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.setSpace('world');
        this.transformControls.size = 0.5;
        //this.transformControls.showZ = false;
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
        if (!event.ctrlKey || !this.bodies.snapEnabled) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.bodies.snap.snapMarkers, true);

        if (intersects.length > 0) {
            let intersected = null
            for (const hit of intersects) {
                if (hit.object.userData.owner?.name === "shape") {
                    intersected = hit.object;
                    break;
                }
            }

            if (!intersected) {
                intersected = intersects[0].object;
            }
            const clickedMarker = intersected;
            const point = clickedMarker.position;
            const parentObject = clickedMarker.userData.owner;

            if (!this.selectedSnap.source) {
                this.selectedSnap.source = point.clone();
                this.selectedSnap.sourceObject = parentObject;
                const isSourceFrame = parentObject === this.bodies.frame;
                if (!isSourceFrame) {
                    this.createSelectionCircle(point); // Show pulse only for mesh point
                }
            } else {
                const source = this.selectedSnap.source;
                const sourceObject = this.selectedSnap.sourceObject;
                const target = point;

                const isSourceFrame = sourceObject === this.bodies.frame;

                if (isSourceFrame) {
                    this.showSnapWarning('❌ Invalid snap: Frame cannot be the source.')
                    this.selectedSnap = {};
                    this.bodies.snap.snapHoverHelperForFrame.visible = false;
                    this.bodies.snap.snapHoverHelperForMesh.visible = false;
                    return;
                }

                // ✅ Allow mesh → frame and mesh → mesh

                this.bodies.snap.snapHoverHelperForFrame.visible = false;
                this.bodies.snap.snapHoverHelperForMesh.visible = false;

                const offset = new THREE.Vector3().subVectors(target, source);
                const originalPosition = sourceObject.position.clone();

                sourceObject.position.add(offset);

                const meshBox = new THREE.Box3().setFromObject(sourceObject);
                const overallBox = new THREE.Box3().setFromObject(this.bodies.frame);
                const isInside = overallBox.containsBox(meshBox);

                if (!isInside) {
                    this.showSnapWarning('❌ Snap rejected: Mesh would move outside the overall frame')
                    sourceObject.position.copy(originalPosition); // Revert move
                } else {
                    console.log("✅ Snap successful.");
                }

                this.bodies.snap.rebuildSnapMarkers3D();
                this.selectedSnap.source = null;
                this.selectedSnap.sourceObject = null;
            }

        }
    }

    createSelectionCircle(position) {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        // Create a radial gradient circle
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.99)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false, // Important: Always visible
        });

        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position.clone().add(new THREE.Vector3(0, 0, 0.1))); // Slightly in front
        const scaleFactor = this.bodies.snap.getFrameScale(); // Inverse of frame scale
        sprite.scale.set(scaleFactor, scaleFactor, 1);

        this.scene.add(sprite);

        const start = performance.now();
        const duration = 800;

        const animate = (time) => {
            const elapsed = time - start;
            const t = Math.min(1, elapsed / duration);

            const scale = scaleFactor * (1 + t); // Grows over time
            sprite.scale.set(scale, scale, 1);
            sprite.material.opacity = 1 - t;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(sprite);
                sprite.material.dispose();
                sprite.geometry?.dispose?.();
            }
        };

        requestAnimationFrame(animate);
    }


    handlePointerMove(event) {
        this.deltaMouse.set(((event.clientX - this.rect.left) / this.rect.width) * 2 - 1,
            -((event.clientY - this.rect.top) / this.rect.height) * 2 + 1);
        if (this.bodies.snapEnabled && this.isCtrlPressed) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            this.raycaster.setFromCamera(mouse, this.camera);
            const snapIntersects = this.raycaster.intersectObjects(this.bodies.snap.snapMarkers, true);
            if (snapIntersects.length > 0) {
                const intersectedSnap = snapIntersects[0].object;
                if (this.bodies.snap.snapMarkers.includes(intersectedSnap)) {
                    const point = intersectedSnap.position;
                    const parentObject = intersectedSnap.userData.owner;

                    // Hide both first
                    this.bodies.snap.snapHoverHelperForFrame.visible = false;
                    this.bodies.snap.snapHoverHelperForMesh.visible = false;

                    if (parentObject === this.bodies.frame) {
                        // Show red plus for frame
                        this.bodies.snap.snapHoverHelperForFrame.visible = true;
                        this.bodies.snap.snapHoverHelperForFrame.position.copy(point);
                    } else {
                        // Show yellow plus for mesh
                        this.bodies.snap.snapHoverHelperForMesh.visible = true;
                        this.bodies.snap.snapHoverHelperForMesh.position.copy(point);
                    }

                    return;
                }
            }
        }
        // Hide if not hovering or Ctrl not pressed
        if (this.bodies.snap?.snapHoverHelperForFrame) {
            this.bodies.snap.snapHoverHelperForFrame.visible = false;
        }
        if (this.bodies.snap?.snapHoverHelperForMesh) {
            this.bodies.snap.snapHoverHelperForMesh.visible = false;
        }
    }
    handleKeyUp(event) {
        if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
            this.isCtrlPressed = false;
            if (this.bodies.snap?.snapHoverHelperForFrame) {
                this.bodies.snap.snapHoverHelperForFrame.visible = false;
            }
            if (this.bodies.snap?.snapHoverHelperForMesh) {
                this.bodies.snap.snapHoverHelperForMesh.visible = false;
            }
        }
    }

    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyT':
                this.transformControls.setMode('translate');
                break;
            case 'KeyR':
                this.transformControls.setMode('rotate');
                break;
            case 'KeyS':
                this.transformControls.setMode('scale');
                break;

            case 'ControlLeft':
            case 'ControlRight':
                this.isCtrlPressed = true;
                break;

            case 'Delete':
                this.deleteSelectedMeshes()
                break

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
        this.bodies.snapEnabled = false
        if (this.mode2D) {
            this.bodies.snap.clearSnapGridData()
            this.enable2DMode();
        } else {
            this.enable3DMode();
        }
    }

    snapSourceToTarget() {
        const source = this.selectedSnap.source;
        const target = this.selectedSnap.target;
        const object = this.selectedSnap.sourceObject;
        if (!source || !target || !object) return;
        const offset = new THREE.Vector3().subVectors(target, source);
        object.position.add(offset); // Move the entire mesh
    }

    enable2DMode() {
        const { width, height, depth } = this.bodies.frame.geometry.parameters
        if (this.plane) {
            this.scene.remove(this.plane);
        }

        if (!this.bodies.transformEnabled) {
            this.bodies.hideAllSprites()
        }

        this.orbitControls.reset();
        if (this.transformControls) {
            this.scene.remove(this.transformControls);
            this.transformControls.detach();
        }

        this.objectMaxSize = Math.max(width, height);

        this.size = this.objectMaxSize * Math.trunc(this.objectMaxSize / 20);
        let gridHelper = this.scene.getObjectByName('gridHelper');

        if (!gridHelper) {
            const data = Math.trunc(this.size / 60)
            gridHelper = new THREE.GridHelper(this.size, data);
            gridHelper.name = 'gridHelper';
            this.bodies.addCornerPoints(this.bodies.frame, data)
            const ratio = this.size / data
            this.bodies.gridPercentage = (ratio * 5) / 100
            this.scene.add(gridHelper);
        }

        this.camera.position.set(0, this.position.z - (depth / 2), 0);
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

        // Remove snap points
        if (this.bodies && this.bodies.snapPoints) {
            this.bodies.snapPoints.forEach(sp => this.scene.remove(sp));
            this.bodies.snapPoints = [];
        }
        const gridHelper = this.scene.getObjectByName('gridHelper');
        const lineSegments = this.scene.getObjectByName('lineSegments');

        if (gridHelper) this.scene.remove(gridHelper);
        if (lineSegments) this.scene.remove(lineSegments);
        this.bodies.twoDObjects.forEach(mesh => {
            if (mesh.name.includes('segments')) {
                this.scene.remove(mesh);
            }
        });

        if (!this.bodies.transformEnabled) {
            this.bodies.showAllSprites()
        }

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
        if (this.mode2D) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        this.raycaster.setFromCamera(mouse, this.camera);

        if (!this.bodies.transformEnabled) {
            // Check for sprite click first
            const spriteIntersects = this.raycaster.intersectObjects(this.bodies.spriteObjects, true);
            if (spriteIntersects.length > 0) {
                if (this.selectedMeshes.length > 1) {
                    this.viewSelectedMeshes();
                } else {
                    this.bodies.overallBodies.forEach((object) => {
                        {
                            if (object.sprite === spriteIntersects[0].object) {
                                this.removeEdgeHighlight(object.mesh)
                                this.popup = new Popup(spriteIntersects[0].object, [object.mesh], this, this.onSave.bind(this), this.onCancel.bind(this));
                                return;
                            }
                        }
                    })
                }
            }
        }
        // Handle mesh selection only if no sprite was clicked
        const objectsToCheck = this.bodies.overallBodies;
        const items = []
        objectsToCheck.forEach((item) => {
            items.push(item.mesh)
        });
        const objectIntersects = this.raycaster.intersectObjects(items, true);

        if (objectIntersects.length > 0) {
            const intersectedObject = objectIntersects[0].object;
            const isAlreadySelected = this.selectedMeshes.includes(intersectedObject);

            if (event.ctrlKey) {
                //    if (!this.bodies.transformEnabled) {
                if (isAlreadySelected) {
                    const index = this.selectedMeshes.indexOf(intersectedObject);
                    this.selectedMeshes.splice(index, 1);
                    this.removeEdgeHighlight(intersectedObject);
                } else {
                    this.selectedMeshes.push(intersectedObject);
                    this.addEdgeHighlight(intersectedObject);
                }
                //    }
            } else {
                if (!isAlreadySelected) {
                    this.selectedMeshes.forEach(mesh => {
                        this.removeEdgeHighlight(mesh);
                    });
                    this.selectedMeshes = [];

                    this.selectedMeshes.push(intersectedObject);
                    this.addEdgeHighlight(intersectedObject);
                }
            }
        } else if (!event.ctrlKey) {
            this.selectedMeshes.forEach(mesh => {
                this.removeEdgeHighlight(mesh);
            });
            this.selectedMeshes = [];
        }

        if (this.bodies.transformEnabled) {
            if (objectIntersects.length > 0) {
                this.handleObjectIntersection(objectIntersects[0].object);
            } else {
                this.resetTransformControls();
            }
        }
    }

    addEdgeHighlight(mesh) {
        const edgeLines = new THREE.EdgesGeometry(mesh.geometry)
        // const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 20 })
        const outlineMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0xffff00) }, // Bright yellow
            },
            vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normal;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
            fragmentShader: `
                    varying vec3 vNormal;
                    uniform vec3 glowColor;
                    void main() {
                        float intensity = pow(1.2 - dot(vNormal, vec3(0, 0, 1)), 2.0);
                        gl_FragColor = vec4(glowColor * intensity, 1.0);
                    }
                `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
        });
        const edgeLineSegments = new THREE.LineSegments(edgeLines, outlineMaterial)
        edgeLineSegments.name = 'selected-part'
        mesh.add(edgeLineSegments)
    }

    removeEdgeHighlight(mesh) {
        const selectedParts = mesh.children.filter(child => child.name === 'selected-part')

        selectedParts.forEach(part => {
            mesh.remove(part)
            part.geometry.dispose()
            part.material.dispose()
        })
    }

    viewSelectedMeshes() {
        if (this.selectedMeshes.length > 0) {
            const tempSprite = new THREE.Sprite()
            this.selectedMeshes.forEach(mesh => {
                this.removeEdgeHighlight(mesh)
            })
            this.popup = new Popup(tempSprite, this.selectedMeshes, this,
                () => this.onSave(),
                () => this.onCancel()
            )
        } else {
            alert('No meshes selected. Click on meshes to select them, then click the Sprite')
        }
    }

    deleteSelectedMeshes() {
        this.removeSelectedPartsEdge();
        this.selectedMeshes.forEach(mesh => {
            const index = this.bodies.overallBodies.findIndex(body => body.mesh === mesh);
            if (index !== -1) {
                this.scene.remove(mesh);
                this.removeEdgeHighlight(mesh);

                const sprite = this.bodies.overallBodies[index].sprite;
                if (sprite) {
                    this.scene.remove(sprite);
                }
                this.bodies.overallBodies.splice(index, 1);
            }
        });
        this.selectedMeshes = [];
        this.resetTransformControls();
    }

    removeSelectedPartsEdge() {
        const selectedPartsEdge = this.scene.children.filter(child => child.name === 'selected-part')
        selectedPartsEdge.forEach(part => {
            this.scene.remove(part)
            part.geometry.dispose()
            part.material.dispose()
        })
    }

    handleObjectIntersection(intersectedObject) {
        this.intersectedObject = intersectedObject;
        // Attach Transform Controls
        this.transformControls.detach();
        this.transformControls.attach(this.intersectedObject);

        // Add Gizmo Helper
        const gizmo = this.transformControls.getHelper();
        this.scene.add(gizmo);

        // Ensure event listeners are properly set up
        this.setupTransformEvents();
    }

    setupTransformEvents() {
        this.transformControls.addEventListener("dragging-changed", (event) => {
            this.orbitControls.enabled = !event.value;
        });

        this.transformControls.addEventListener("objectChange", (e) => {
            if (this.transformControls.mode === "scale") {
                if (this.checkLimitaionScaling()) {
                    this.temporaryScale.set(this.intersectedObject.scale.x, this.intersectedObject.scale.y, this.intersectedObject.scale.z)
                } else {
                    this.intersectedObject.scale.set(this.temporaryScale.x, this.temporaryScale.y, this.temporaryScale.z)
                }
                const frame = this.bodies.frame
                scaleModel(this, frame)
                this.dimensions.add3DDimensionsToRectangles(this.intersectedObject);
            }
            this.restrictDoorMovement(this.intersectedObject);
        });

        this.transformControls.addEventListener("mouseDown", () => this.handleMouseDown());
        this.transformControls.addEventListener("mouseUp", () => this.handleMouseUp());
    }
    checkLimitaionScaling() {
        const boundaryBoundingBox = new THREE.Box3().setFromObject(this.bodies.frame);
        const modelBoundingBox = new THREE.Box3().setFromObject(this.intersectedObject);
        if (boundaryBoundingBox.containsBox(modelBoundingBox)) {
            return true
        } else {
            return false
        }
    }

    handleMouseDown() {
        const {x,y,z} = this.intersectedObject.position.clone()
        const scale = this.intersectedObject.scale.clone()
        if (this.transformControls.mode === "scale") {
            const modelBox = new THREE.Box3().setFromObject(this.intersectedObject);
            const frameBox = new THREE.Box3().setFromObject(this.bodies.frame);


            const bigSize = new THREE.Vector3();
            const smallSize = new THREE.Vector3();

            frameBox.getSize(bigSize);
            modelBox.getSize(smallSize);

            this.minBox.copy(modelBox.min);
            this.maxBox.copy(modelBox.max);

            // Track mouse direction only once
            if (!this._mouseMoveHandler) {
                this.lastMouseX = 0;
                this._mouseMoveHandler = (event) => {
                    const mouseX = event.clientX;
                    this.lastMouseX = mouseX;
                };
                window.addEventListener('mousemove', this._mouseMoveHandler);
            }


            modelBox.getSize(smallSize);
            this.orbitControls.enabled = false
        }

        this.transformControls.attach(this.intersectedObject);
        this.mouseDownValue.position.set(x,y,z)
        this.mouseDownValue.scale.set(scale.x,scale.y,scale.z)
    }

    handleMouseUp() {
        this.cleanupOutline()
        if (this.transformControls.mode === "scale") {
            this.bodies.transformEnabled = true
            this.transformControls.detach();
            this.dimensions.removeDimensions();
        }
       
        if(this.intersected){
            this.intersectedObject.position.set(this.mouseDownValue.position.x,this.mouseDownValue.position.y,this.mouseDownValue.position.z)
            this.intersectedObject.scale.set(this.mouseDownValue.scale.x,this.mouseDownValue.scale.y,this.mouseDownValue.scale.z)
            this.intersectedObject.material.color = new THREE.Color(rectColor.initialColor)
        }
    }

    resetPivot() {
        this.bodies.pivot.position.set(0, 0, 0);
        this.bodies.pivot.scale.set(1, 1, 1);
        this.bodies.pivot.rotation.set(0, 0, 0);
    }



    cleanupOutline() {
        if (this.selectedOutline) {
            this.selectedOutline.geometry.dispose();
            this.selectedOutline.material.dispose();
            if (this.intersectedObject) {
                this.intersectedObject.remove(this.selectedOutline);
            }
            this.selectedOutline = null;
        }
    }


    // highlightSelectedObject(intersectedObject) {
    //     if (this.selectedOutline) {
    //         intersectedObject.children = []
    //         this.scene.remove(this.selectedOutline);
    //         this.selectedOutline.geometry.dispose();
    //         this.selectedOutline.material.dispose();
    //         this.selectedOutline = null;
    //     }

    //     if (!intersectedObject) return;

    //     // Create a wireframe edges geometry
    //     const edgesGeometry = new THREE.EdgesGeometry(intersectedObject.geometry);
    //     /* const outlineMaterial = new THREE.LineBasicMaterial({
    //         color: 0xffff00, // Yellow
    //         linewidth: 3, // Line thickness (might not work in all browsers)
    //     }); */
    //     const outlineMaterial = new THREE.ShaderMaterial({
    //         uniforms: {
    //             glowColor: { value: new THREE.Color(0xffff00) }, // Bright yellow
    //         },
    //         vertexShader: `
    //             varying vec3 vNormal;
    //             void main() {
    //                 vNormal = normal;
    //                 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    //             }
    //         `,
    //         fragmentShader: `
    //             varying vec3 vNormal;
    //             uniform vec3 glowColor;
    //             void main() {
    //                 float intensity = pow(1.2 - dot(vNormal, vec3(0, 0, 1)), 2.0);
    //                 gl_FragColor = vec4(glowColor * intensity, 1.0);
    //             }
    //         `,
    //         side: THREE.BackSide,
    //         blending: THREE.AdditiveBlending,
    //         transparent: true,
    //     });

    //     this.selectedOutline = new THREE.LineSegments(edgesGeometry, outlineMaterial);
    //     intersectedObject.add(this.selectedOutline)
    // }


    resetTransformControls() {
        this.transformControls.detach();
        this.orbitControls.enabled = true;
    }

    restrictDoorMovement(intersectedObject) {
        if (!this.overallDimensionValues) return;
        this.intersected = false
        const modelBoundingBox = new THREE.Box3().setFromObject(intersectedObject);
        const boundaryBoundingBox = new THREE.Box3().setFromObject(this.bodies.frame);

        const restrictPosition = (position, halfDimension, rectangleHalf) => {
            return THREE.MathUtils.clamp(position, halfDimension, rectangleHalf);
        };
        const testBox = new THREE.Box3().setFromObject(intersectedObject);

        const filteredArray = this.bodies.overallBodies.filter(mesh => mesh.mesh.uuid !== intersectedObject.uuid);
        const overlaps = filteredArray.some(mesh => {

            const meshBox = new THREE.Box3().setFromObject(mesh.mesh);
            return testBox.intersectsBox(meshBox);
        });

        if (this.intersectedObject.material.color.r === 1) {

            this.intersectedObject.material.color = new THREE.Color(rectColor.initialColor)
        }
        if (overlaps) {
            this.intersected = true
            intersectedObject.material.color = new THREE.Color(rectColor.collisionColor)
        }

        if (
            boundaryBoundingBox.max.x < modelBoundingBox.max.x ||
            boundaryBoundingBox.min.x > modelBoundingBox.min.x ||
            boundaryBoundingBox.min.y > modelBoundingBox.min.y ||
            boundaryBoundingBox.max.y < modelBoundingBox.max.y ||
            boundaryBoundingBox.max.z < modelBoundingBox.max.z ||
            boundaryBoundingBox.min.z > modelBoundingBox.min.z

        ) {
            intersectedObject.position.x = restrictPosition(
                intersectedObject.position.x,
                boundaryBoundingBox.min.x + (modelBoundingBox.getSize(new THREE.Vector3()).x / 2),
                boundaryBoundingBox.max.x - (modelBoundingBox.getSize(new THREE.Vector3()).x / 2)
            );
            intersectedObject.position.y = restrictPosition(
                intersectedObject.position.y,
                boundaryBoundingBox.min.y + modelBoundingBox.getSize(new THREE.Vector3()).y / 2,
                boundaryBoundingBox.max.y - modelBoundingBox.getSize(new THREE.Vector3()).y / 2
            );
            intersectedObject.position.z = restrictPosition(
                intersectedObject.position.z,
                boundaryBoundingBox.min.z + modelBoundingBox.getSize(new THREE.Vector3()).z / 2,
                boundaryBoundingBox.max.z - modelBoundingBox.getSize(new THREE.Vector3()).z / 2
            );
        }

    }

    showSnapWarning(message, duration = 2000) {
        const el = document.getElementById("snap-warning");
        if (!el) return;
        el.textContent = message;
        el.style.display = "block";

        clearTimeout(this._snapWarningTimeout);
        this._snapWarningTimeout = setTimeout(() => {
            el.style.display = "none";
        }, duration);
    }

    onSave() {
        this.selectedMeshes.forEach(mesh => {
            this.removeEdgeHighlight(mesh);
        });
        this.selectedMeshes = [];
    }

    onCancel() {
        this.selectedMeshes.forEach(mesh => {
            this.removeEdgeHighlight(mesh);
        });
        this.selectedMeshes = [];
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
