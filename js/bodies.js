import * as THREE from 'three';
import { DragControls } from "three/addons/controls/DragControls.js";
import { SnapPoints } from './snapToPoints.js';

class Bodies {
    constructor(viewer) {
        this.viewer = viewer
        this.spriteObjects = [];
        this.arcBodies = [];
        this.overallBodies = [];
        this.frame = null
        this.twoDObjects = []
        this.transformEnabled = true
        this.snapPoints = []
        this.points = [];
        this.innerObjects = []
        this.snap = new SnapPoints(this)
        this.gridPercentage = 0
    }

    addOverallDimension(width, height, depth) {
        let { scene, raycasterObject } = this.viewer;

        // Only update if frame already exists
        if (this.frame) {
            this.frame.geometry.dispose(); // Dispose old geometry
            this.frame.geometry = new THREE.BoxGeometry(width, height, depth);
            this.frame.geometry.computeBoundingSphere();
            this.viewer.overallDimensionValues = { width, height, depth };
            this.initializeWithFrame(this.frame.geometry);
            return;
        }

        // Else create new frame
        this.viewer.overallDimensionValues = { width, height, depth };
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: '#82807C',
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });

        this.frame = new THREE.Mesh(geometry, material);
        this.frame.castShadow = true;
        this.frame.receiveShadow = true;
        this.frame.name = 'frame';
        this.frame.position.z = -0.1;

        scene.add(this.frame);
        raycasterObject.push(this.frame);

        geometry.computeBoundingSphere();
        this.initializeWithFrame(geometry);
    }


    initializeWithFrame(geometry) {
        const boundingSphere = geometry.boundingSphere;
        const radius = boundingSphere.radius
        const centerOfGeometry = this.frame.localToWorld(boundingSphere.center.clone());
        const fov = this.viewer.camera.fov;
        const zOffset = 1.3 * radius / Math.tan(fov * Math.PI / 360)
        const [x, y, z] = [centerOfGeometry.x, centerOfGeometry.y, (centerOfGeometry.z + zOffset)]

        this.viewer.position.z = z
        this.viewer.camera.position.set(x, y, z);
        this.viewer.setupLights(z, geometry.parameters.depth)

    }
    addRectangle({ widthBox, heightBox, depthBox }) {
        if (this.viewer.mode2D) {
            this.create2DShape(widthBox, heightBox, depthBox);
        } else {
            this.createRectangle(widthBox, heightBox, depthBox, true)
            this.viewer.animate();
        }
    }

    create2DShape(widthBox, heightBox, depthBox) {
        console.log('yash')
        const tri = new THREE.Shape();
        tri.moveTo(-widthBox / 2, heightBox / 2);
        tri.lineTo(widthBox / 2, heightBox / 2);
        tri.lineTo(widthBox / 2, -heightBox / 2);
        tri.lineTo(-widthBox / 2, -heightBox / 2)
        tri.lineTo(-widthBox / 2, heightBox / 2)
        const geometry = new THREE.ShapeGeometry(tri);
        const lineSegments = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: "#7F4125" }))
        lineSegments.material.side = THREE.DoubleSide
        lineSegments.name = 'segments'
        lineSegments.position.y = 0.3;
        lineSegments.rotation.x = Math.PI / 2
        this.viewer.scene.add(lineSegments);
        this.innerObjects.push({ lineSegments, width: widthBox, height: heightBox, depth: depthBox });
        this.twoDObjects.push(lineSegments)
        this.createRectangle(widthBox, heightBox, depthBox, false, lineSegments)
    }

    createRectangle(widthBox, heightBox, depthBox, visible, lineSegments) {
        console.log('yash2')
        const material = new THREE.MeshStandardMaterial({ color: '#7F4125' });
        material.transparent = true
        material.opacity = 0.6
        const rectangle = new THREE.Mesh(new THREE.BoxGeometry(widthBox, heightBox, depthBox), material);
        rectangle.castShadow = true;
        rectangle.name = 'shape';
        rectangle.renderOrder = 1; // Try higher numbers if needed
        const val =this.findFreePosition(rectangle)
        if(val) {
            rectangle.position.set(val.x,val.y,val.z)
        } else{
            alert('Entered maximum limit 😔');
            return ;
        }
        const textureLoader = new THREE.TextureLoader();
        const spriteMaterial = new THREE.SpriteMaterial({
            map: textureLoader.load('https://media-hosting.imagekit.io/b856a4f175bf4f98/sprite.png?Expires=1838118552&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=p21IjJNaJ5N1qf~pedo4XTU-vsLY8raIqieZeDZI9VC8eDxOuGSy8PwDniJtQxmpLjrmQASnSOlZouaDUDE2WemoJKOw2~4T7ODshHJ2Zh2UxvhpgJJt4BtB9VB5lb7qI8JmpbDxP1PD2Nz~7loweKi4MUgwUbBBeNjdIZuyeI9Fh9E-DeLD7W9tmhD~ZgtfldRRKOuTUXu4CfJbI9FNa9ESXQsOGlR7t-RE9YcOQlPcRipYaQg3AyhSAizUMK58dh34l9iCe3AUB8Qe2TKX6pGp22EqPUgYOjuG9jP~fBPz~-Bdyqzbe1fhU3035Qa4K9N8rAxhtyHRRH8VhoMu9w__'),
            transparent: true,
            sizeAttenuation: false,
            depthTest: false,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.025, 0.025, 0.025);
        sprite.visible = !this.transformEnabled;
        this.pivot = new THREE.Object3D();
        this.viewer.scene.add(this.pivot);
        sprite.renderOrder = 2; // Try higher numbers if needed
        if (visible) this.viewer.scene.add(rectangle);
        // rectangle.position.y = 0.1;
        if (lineSegments) {
            const object = { lineSegments, width: widthBox, height: heightBox, depth: depthBox }
            this.overallBodies.push({ mesh: rectangle, line: object, sprite: sprite });
        } else {
            this.overallBodies.push({ mesh: rectangle, sprite: sprite });
        }
        console.log(this.snapEnabled)
        if (this.snapEnabled) {
            if (!this.viewer.mode2D) {
                this.snap.rebuildSnapMarkers3D();
            } else {
                this.snap.rebuildSnapMarkers2D();
            }
        }

        this.spriteObjects.push(sprite);
        this.viewer.scene.add(sprite);
        return rectangle
    }
    findFreePosition(rectangle) {
        const boardBox = new THREE.Box3().setFromObject(this.frame);
        const rectWidth = rectangle.geometry.parameters.width;
        const rectHeight = rectangle.geometry.parameters.height;
        const rectDepth = rectangle.geometry.parameters.depth;
        const updatedArray = [...this.overallBodies];
        let overlaps = false
        for (let x = boardBox.min.x + rectWidth / 2; x <= boardBox.max.x - rectWidth / 2; x += rectWidth / 4 ) {
            for (let y = boardBox.min.y + rectHeight / 2; y <= boardBox.max.y - rectHeight / 2; y += rectHeight / 4) {            
                const testBox = new THREE.Box3(
                    new THREE.Vector3(x - rectWidth / 2, y - rectHeight / 2,boardBox.max.z - rectDepth/2),
                    new THREE.Vector3(x + rectWidth / 2, y + rectHeight / 2,boardBox.max.z - rectDepth/2)
                );
                 overlaps = updatedArray.some(mesh => {
                    const meshBox = new THREE.Box3().setFromObject(mesh.mesh);
                    return testBox.intersectsBox(meshBox);
                });    
                if (!overlaps) {
                    return new THREE.Vector3(x, y,boardBox.max.z - rectDepth/2); 
                }
            }
        }
        return null; 
    }
    

    generate2DDrawing() {
        if (this.frame) {
            let positions = this.frame.geometry.attributes.position.array
            const updatedArray = JSON.parse(JSON.stringify(positions))
            for (let i = 0; i < positions.length; i += 3) {
                updatedArray[i + 2] = 0;
            }

            function splitPoints(positions) {
                const uniquePositions = [];
                const seen = new Set();

                for (let i = 0; i < positions.length; i += 3) {
                    const point = new THREE.Vector3(updatedArray[i], updatedArray[i + 1], updatedArray[i + 2]);
                    const key = `${point.x},${point.y},${point.z}`;
                    seen.add(key);
                    uniquePositions.push(point);
                }
                return uniquePositions
            }

            let uniquePositionsBuffer1 = splitPoints(positions);
            const tri = new THREE.Shape();
            tri.moveTo(uniquePositionsBuffer1[0].x, uniquePositionsBuffer1[0].y);
            for (let i = 0; i < uniquePositionsBuffer1.length; i++) {
                tri.lineTo(uniquePositionsBuffer1[i].x, uniquePositionsBuffer1[i].y);
            }
            tri.lineTo(uniquePositionsBuffer1[0].x, uniquePositionsBuffer1[0].y)
            const geometry = new THREE.ShapeGeometry(tri);
            const lineSegments = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#C1C0BD' }));
            lineSegments.material.side = THREE.DoubleSide
            lineSegments.name = 'lineSegments'
            lineSegments.rotation.x = Math.PI / 2
            lineSegments.position.y = -0.1;
            this.viewer.scene.add(lineSegments);

        }
        if (this.overallBodies) {
            this.overallBodies.forEach((child, i) => {
                let positions = child.mesh.geometry.attributes.position.array

                const updatedArray = JSON.parse(JSON.stringify(positions))
                for (let i = 0; i < positions.length; i += 3) {
                    updatedArray[i + 2] = 0;

                }

                function splitPoints() {
                    const uniquePositions = [];
                    const seen = new Set();

                    for (let i = 0; i < positions.length; i += 3) {
                        const point = new THREE.Vector3(updatedArray[i], updatedArray[i + 1], updatedArray[i + 2]);
                        const key = `${point.x},${point.y},${point.z}`;
                        seen.add(key);
                        uniquePositions.push(point);
                    }

                    return uniquePositions
                }
                let uniquePositionsBuffer1 = splitPoints();
                const tri = new THREE.Shape();
                tri.moveTo(uniquePositionsBuffer1[0].x, uniquePositionsBuffer1[0].y);
                for (let i = 0; i < uniquePositionsBuffer1.length; i++) {
                    tri.lineTo(uniquePositionsBuffer1[i].x, uniquePositionsBuffer1[i].y);
                }
                tri.lineTo(uniquePositionsBuffer1[0].x, uniquePositionsBuffer1[0].y)
                const geometry = new THREE.ShapeGeometry(tri);
                const lineSegments = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: child.mesh.material.color }))
                lineSegments.material.side = THREE.DoubleSide
                lineSegments.name = `segments${i}`;
                lineSegments.rotation.x = Math.PI / 2;
                lineSegments.position.set(child.mesh.position.x, 0.3, -child.mesh.position.y);

                this.viewer.scene.add(lineSegments);
                this.twoDObjects.push(lineSegments);

                const { width, height, depth } = child.mesh.geometry.parameters;;

                this.innerObjects.push({ lineSegments, width, height, depth });
                lineSegments.scale.copy(child.mesh.scale);
                lineSegments.rotation.z = -child.mesh.rotation.z;


                this.overallBodies[i].line = { lineSegments, width, height, depth }

            })
        }
    }


    toggleTransformMode() {
        this.transformEnabled = !this.transformEnabled;
        this.snap.clearSnapGridData();
        if (this.transformEnabled) {
            this.viewer.scene.add(this.viewer.transformControls);
            this.enableSprite(true)
        } else {
            this.viewer.scene.remove(this.viewer.transformControls);
            this.viewer.transformControls.detach();
            this.enableSprite(false)
        }
    }
    enableSprite(enabled) {
        this.overallBodies.forEach((obj) => {
            if (!obj) return
            obj.sprite.position.set(obj.mesh.position.x, obj.mesh.position.y, obj.mesh.position.z);
            obj.sprite.visible = !enabled
            this.viewer.scene.add(obj.sprite)
        });
    }

    hideAllSprites() {
        this.spriteObjects.forEach(sprite => {
            sprite.visible = false;
        });
    }

    showAllSprites() {
        this.spriteObjects.forEach(sprite => {
            sprite.visible = true;
        });
    }

    addDragControls(event) {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        let cam = this.viewer.camera;
        this.renderer = this.viewer.renderer;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, cam);

        this.intersects = this.raycaster.intersectObjects(this.twoDObjects);
        this.dragControls = new DragControls(this.twoDObjects, cam, this.renderer.domElement);
        this.dragControls.addEventListener("drag", (event) => {
            const draggedObject = event.object;
            this.snap.snapToNearestPoint(draggedObject);
            this.restrictDoorMovement(draggedObject)
            this.snap.snapTogrid(draggedObject)
            this.snap.updateSnapPointsFor2DRectangles();

        });

    }

    addCornerPoints(frame, division) {
        const boundaryBoundingBox = new THREE.Box3().setFromObject(frame);
        const boundaryMin = boundaryBoundingBox.min;
        const boundaryMax = boundaryBoundingBox.max;
        const step = (this.viewer.size) / division;
        const halfSize = (this.viewer.size) / 2;
        const halfStep = step / 2;
        const offset = halfSize - halfStep;

        for (let i = 0; i < division; i++) {

            for (let j = 0; j < division; j++) {
                const baseX = offset - i * step;
                const baseZ = offset - j * step;
                const offsetX = step / 2;
                const offsetZ = step / 2;
                if (boundaryMin.x <= baseX && boundaryMax.x >= baseX - offsetX && boundaryMin.y <= baseZ + offsetZ && boundaryMax.y >= baseZ + offsetZ) {
                    this.points.push(new THREE.Vector3(baseX - offsetX, 0.1, baseZ + offsetZ));
                }

            }

        }
    }

    restrictDoorMovement(intersectedObject,) {
        const modelBoundingBox = new THREE.Box3().setFromObject(intersectedObject);
        const restrictPosition = (position, halfDimension, rectangleHalf) => {
            return THREE.MathUtils.clamp(position, halfDimension, rectangleHalf);
        };
        const boundaryBoundingBox = new THREE.Box3().setFromObject(this.frame);
        const modelSize = modelBoundingBox.getSize(new THREE.Vector3());

        const boundaryMin = boundaryBoundingBox.min;
        const boundaryMax = boundaryBoundingBox.max;

        const modelHalfWidth = modelSize.x / 2;
        const modelHalfHeight = modelSize.z / 2;

        const intersectedPosition = intersectedObject.position;

        if (boundaryMax.x < modelBoundingBox.max.x || boundaryMin.x > modelBoundingBox.min.x || boundaryMin.y > -modelBoundingBox.max.z || boundaryMax.y < -modelBoundingBox.min.z) {
            intersectedPosition.x = restrictPosition(intersectedPosition.x, boundaryMin.x + modelHalfWidth, boundaryMax.x - modelHalfWidth);
            intersectedPosition.z = restrictPosition(intersectedPosition.z, boundaryMin.y + modelHalfHeight, boundaryMax.y - modelHalfHeight);
            intersectedPosition.y = 0.1;
            return;
        }

    }

    switchSnap() {
        this.snapEnabled = !this.snapEnabled;
        if (this.snapEnabled) {

            if (this.viewer.mode2D) {
                console.log(this.viewer.mode2D, '  this.viewer.mode2D')
                this.snap.addSnapPointsTo2Drectangles()

            } else {
                console.log(this.viewer.mode2D, '  this.viewer.mode2D')
                this.snap.addSnapPointsTo3D();
            }
            // this.viewer.mode2D ? this.snap.addSnapPointsTo2Drectangles() : this.snap.addSnapPointsTo3D();
        } else {
            this.snap.clearSnapGridData()
            this.snap.removeSnapPoints(this.viewer.mode2D);
        }
    }
}

export { Bodies };
