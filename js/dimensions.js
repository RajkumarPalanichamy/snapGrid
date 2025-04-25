import * as THREE from 'three';

class Dimensions {
    constructor(viewer) {
        this.viewer = viewer;
        this.dimensionLines = [];
    }

    add3DDimensionsToRectangles(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const boundingDiagonal = size.length();
        const cameraDistance = this.viewer.camera.position.distanceTo(center);
        const offsetDistance = Math.max(boundingDiagonal * 0.01, cameraDistance * 0.02);

        if (mesh.userData.dimensionLines) {
            mesh.userData.dimensionLines.forEach(line => this.viewer.scene.remove(line));
        }

        const width = size.x;
        const height = size.y;
        const depth = size.z;
        const scale = mesh.scale.clone();

        const createDimensionArrows = (start, end) => {
            const direction = new THREE.Vector3().subVectors(end, start).normalize();
            const length = start.distanceTo(end);
            const cameraDistance = this.viewer.camera.position.distanceTo(center);
            const arrowSize = cameraDistance * 0.02;
            const arrowWidth = cameraDistance * 0.008;

            const arrow1 = new THREE.ArrowHelper(direction, start, length, 0x000000, arrowSize, arrowWidth);
            const arrow2 = new THREE.ArrowHelper(direction.clone().negate(), end, length, 0x000000, arrowSize, arrowWidth);

            this.viewer.scene.add(arrow1);
            this.viewer.scene.add(arrow2);
            this.dimensionLines.push(arrow1, arrow2);

            return [arrow1, arrow2];
        };

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const topStart = new THREE.Vector3(center.x - halfWidth, center.y + halfHeight + offsetDistance, center.z);
        const topEnd = new THREE.Vector3(center.x + halfWidth, center.y + halfHeight + offsetDistance, center.z);

        const sideStart = new THREE.Vector3(center.x + halfWidth + offsetDistance, center.y - halfHeight, center.z);
        const sideEnd = new THREE.Vector3(center.x + halfWidth + offsetDistance, center.y + halfHeight, center.z);

        const frontStart = new THREE.Vector3(center.x - halfWidth - offsetDistance, center.y, center.z - depth / 2);
        const frontEnd = new THREE.Vector3(center.x - halfWidth - offsetDistance, center.y, center.z + depth / 2);

        const topArrows = createDimensionArrows(topStart, topEnd);
        const sideArrows = createDimensionArrows(sideStart, sideEnd);
        const depthArrows = createDimensionArrows(frontStart, frontEnd);

        mesh.userData.dimensionLines = [...topArrows, ...sideArrows, ...depthArrows];

        // Update dimension box
        this.updateDimensionBox(width + scale.x, height + scale.y, depth + scale.z);
    }

    updateDimensionBox(width, height, depth) {
        let dimensionBox = document.getElementById("dimension-box");

        if (!dimensionBox) {


            // Attach to appropriate container
            const miniContainer = document.getElementById("mini-container");
            if (miniContainer) {
                dimensionBox = document.createElement("div");
                dimensionBox.id = "dimension-box";
                dimensionBox.style.position = "absolute";
                dimensionBox.style.background = "rgb(0, 64, 128)";
                dimensionBox.style.border = "1px solid #ccc";
                dimensionBox.style.fontSize = "14px";
                dimensionBox.style.color = "white";
                dimensionBox.style.zIndex = "999";
                dimensionBox.style.fontFamily = "monospace";
                dimensionBox.style.padding = "8px 12px";
                dimensionBox.style.borderRadius = "6px";
                // dimensionBox.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                miniContainer.appendChild(dimensionBox);
            } else {
                dimensionBox = document.createElement("div");
                dimensionBox.id = "dimension-box";
                dimensionBox.style.position = "absolute";
                dimensionBox.style.top = "60px";
                dimensionBox.style.right = "20px";
                dimensionBox.style.background = "rgb(0, 64, 128)";
                dimensionBox.style.border = "1px solid #ccc";
                dimensionBox.style.fontSize = "14px";
                dimensionBox.style.color = "white";
                dimensionBox.style.zIndex = "10";
                dimensionBox.style.fontFamily = "monospace";
                dimensionBox.style.padding = "8px 12px";
                dimensionBox.style.borderRadius = "6px";
                //  dimensionBox.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                document.body.appendChild(dimensionBox);
            }
        }

        // Update box content
        dimensionBox.innerHTML = `
            <div><strong>X:</strong> ${Math.round(width)} mm</div>
            <div><strong>Y:</strong> ${Math.round(height)} mm</div>
            <div><strong>Z:</strong> ${Math.round(depth)} mm</div>
        `;

        // Set position based on parent
        if (dimensionBox.parentElement?.id === "mini-container") {
            dimensionBox.style.top = "30px";
            dimensionBox.style.right = "570px";
            dimensionBox.style.zIndex = "1000";

        } else {
            dimensionBox.style.top = "60px";
            dimensionBox.style.right = "20px";
        }

        dimensionBox.style.display = "block";
    }


    hideDimensionBox() {
        const box = document.getElementById("dimension-box");
        if (box && box.parentNode) {
            box.style.display = "none";
            box.parentNode.removeChild(box);
        }
    }

    removeDimensions() {
        if (this.dimensionLines.length > 0) {
            this.dimensionLines.forEach(line => this.viewer.scene.remove(line));
            this.dimensionLines = [];
        }

        if (this.viewer.bodies) {
            this.viewer.bodies.overallBodies.forEach(mesh => {
                if (mesh.mesh.userData.dimensionLines) {
                    mesh.mesh.userData.dimensionLines.forEach(line => this.viewer.scene.remove(line));
                    delete mesh.mesh.userData.dimensionLines;
                }
            });
        }

        this.hideDimensionBox();
    }
}

export { Dimensions };
