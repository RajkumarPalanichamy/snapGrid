import { MiniViewer } from './miniViewer.js';
import { API } from './api.js';

class Popup {
    constructor(selectedRectangle, mesh, viewer, onSave, onCancel) {
        this.selectedRectangle = selectedRectangle;
        this.onSave = onSave
        this.onCancel = onCancel
        this.viewer = viewer
        this.meshes = mesh

        const getProperties = (parent) => ({
            position: parent.position.clone(),
            color: `#${parent.material.color.getHexString()}`,
            opacity: parent.material.opacity,
            metalness: parent.material.metalness,
            roughness: parent.material.roughness,
            type: parent.userData?.type || ""
        })

        this.initialProperties = this.meshes.length === 0
            ? alert('Please choose the model')
            : this.meshes.map(getProperties);

        this.init();
    }

    init() {
        this.createPopup();
    }

    createPopup() {
        // Remove existing popup if any
        const existingPopup = document.getElementById("popupContainer");
        if (existingPopup) existingPopup.remove();

        // Create popup container
        this.popupContainer = document.createElement("div");
        this.popupContainer.id = "popupContainer";
        this.popupContainer.style.position = "fixed";
        this.popupContainer.style.top = "10%";
        this.popupContainer.style.left = "10%";
        this.popupContainer.style.width = "75%";
        this.popupContainer.style.height = "80%";
        this.popupContainer.style.background = "white";
        this.popupContainer.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
        this.popupContainer.style.zIndex = "1000";
        this.popupContainer.style.borderRadius = "8px";
        this.popupContainer.style.display = "flex";

        // Left side - Mini viewer container
        this.miniContainer = document.createElement("div");
        this.miniContainer.id = "mini-container";
        this.miniContainer.style.width = "890px";
        this.miniContainer.style.height = "710px";
        this.miniContainer.style.background = "#ddd";

        // Right side - Material Properties
        this.detailsContainer = document.createElement("div");
        this.detailsContainer.style.width = "40%";
        this.detailsContainer.style.padding = "20px";
        this.detailsContainer.style.display = "flex";
        this.detailsContainer.style.flexDirection = "column";
        this.detailsContainer.style.background = "#f9f9f9";

        // Replace the type text input with dropdown
        const typeLabel = document.createElement("label")
        typeLabel.innerText = "Type:"
        const typeSelect = document.createElement("select")
        typeSelect.style.marginBottom = "15px"
        typeSelect.style.padding = "5px"
        typeSelect.value = this.meshes.forEach((mesh) => { mesh?.userData?.type || ""; })


        // Add the four type options
        const types = ["Choose the type!!", "article", "part", "profile", "item master"]
        types.forEach(type => {
            const option = document.createElement("option")
            option.value = type
            option.text = type.charAt(0).toUpperCase() + type.slice(1) // Capitalize first letter
            typeSelect.appendChild(option)
        })

        // Create scrollable data box
        const dataBoxContainer = document.createElement("div")
        dataBoxContainer.style.marginTop = "15px"
        dataBoxContainer.style.marginBottom = "15px"

        const dataBox = document.createElement("div")
        dataBox.style.height = "200px"
        dataBox.style.overflowY = "auto"
        dataBox.style.border = "1px solid #ccc"
        dataBox.style.padding = "10px"
        dataBox.style.borderRadius = "4px"
        dataBox.style.backgroundColor = "#fff"
        dataBox.innerHTML = '<div>Please Choose the Type!!</div>'

        // Handle type change
        typeSelect.onchange = async () => {
            const selectedType = typeSelect.value
            dataBox.innerHTML = '' // Clear previous content

            switch (selectedType) {
                case 'Choose the type!!':
                    dataBox.innerHTML = '<div>Please Choose the Type!!</div>'
                    break
                case 'article':
                    this.updateMaterial('color', 0x8c3118)
                    this.articleData = await API.loadArticleData()
                    if (this.articleData) {
                        this.articleData.data.forEach(article => {
                            const div = document.createElement("div")
                            div.style.padding = "5px"
                            div.style.borderBottom = "1px solid #eee"
                            div.textContent = article.name ? article.name : article.id
                            div.value = article.id

                            div.style.cursor = "pointer"
                            div.style.transition = "background-color 0.3s"

                            div.onmouseover = () => {
                                div.style.backgroundColor = "#f0f0f0"
                            }
                            div.onmouseout = () => {
                                div.style.backgroundColor = ""
                            }
                            div.onclick = () => {
                                this.handleItemClick(article.id, 'article');
                            }

                            dataBox.appendChild(div)
                        })
                    }
                    break
                case 'part':
                    this.updateMaterial('color', 0x371a75)
                    this.partData = await API.loadPartData()
                    if (this.partData) {
                        this.partData.data.forEach(part => {
                            const div = document.createElement("div")
                            div.style.padding = "5px"
                            div.style.borderBottom = "1px solid #eee"
                            div.textContent = part.name.en ? part.name.en : part.id
                            div.value = part.id

                            div.style.cursor = "pointer"
                            div.style.transition = "background-color 0.3s"

                            div.onmouseover = () => {
                                div.style.backgroundColor = "#f0f0f0"
                            }
                            div.onmouseout = () => {
                                div.style.backgroundColor = ""
                            }

                            div.onclick = () => {
                                this.handleItemClick(part.id, 'part');
                            }

                            dataBox.appendChild(div)
                        })
                    }
                    break
                case 'profile':
                    this.updateMaterial('color', 0x0e8499)
                    this.profileData = await API.loadProfileData()
            
                    
                    if (this.profileData) {
                        this.profileData.data.forEach(profile => {
                            const div = document.createElement("div")
                            div.style.padding = "5px"
                            div.style.borderBottom = "1px solid #eee"
                            div.textContent = profile.name.en ? profile.name.en : profile.id
                            div.value = profile.id

                            div.style.cursor = "pointer"
                            div.style.transition = "background-color 0.3s"

                            div.onmouseover = () => {
                                div.style.backgroundColor = "#f0f0f0"
                            }
                            div.onmouseout = () => {
                                div.style.backgroundColor = ""
                            }

                            div.onclick = () => {
                                this.handleItemClick(profile.id, 'profile');
                            }

                            dataBox.appendChild(div)
                        })
                    }
                    break
                case 'item master':
                    this.updateMaterial('color', 0x4f9116)
                    this.itemMasterData = await API.loadItemMasterData()
                
                    if (this.itemMasterData) {
                        this.itemMasterData.data.forEach(itemMaster => {
                            const div = document.createElement("div")
                            div.style.padding = "5px"
                            div.style.borderBottom = "1px solid #eee"
                            div.textContent = itemMaster.name.en ? itemMaster.name.en : itemMaster.id
                            div.value = itemMaster.id

                            div.style.cursor = "pointer"
                            div.style.transition = "background-color 0.3s"

                            div.onmouseover = () => {
                                div.style.backgroundColor = "#f0f0f0"
                            }
                            div.onmouseout = () => {
                                div.style.backgroundColor = ""
                            }

                            div.onclick = () => {
                                this.handleItemClick(itemMaster.id, 'item master');
                            }

                            dataBox.appendChild(div)
                        })
                    }
                    break
            }
        }

        this.typeSelect = typeSelect
        dataBoxContainer.appendChild(dataBox)

        this.detailsContainer.appendChild(typeLabel)
        this.detailsContainer.appendChild(typeSelect)
        this.detailsContainer.appendChild(dataBoxContainer)

        // Title
        const titleProperties = document.createElement("h2");
        titleProperties.innerText = "Position Properties";
        // if(this.meshes.length > 1) titleProperties.style.display = 'none'
        this.detailsContainer.appendChild(titleProperties);

        this.detailsContainer.appendChild(this.createPositionInput("X Position", "x"));
        this.detailsContainer.appendChild(this.createPositionInput("Y Position", "y"));

        // Save Button
        const saveButton = document.createElement("button");
        saveButton.innerText = "Save";
        saveButton.style.marginTop = "20px";
        saveButton.style.padding = "10px";
        saveButton.style.background = "#004080";
        saveButton.style.color = "white";
        saveButton.style.border = "none";
        saveButton.style.cursor = "pointer";
        saveButton.onclick = () => this.saveChanges();
        this.detailsContainer.appendChild(saveButton);

        const cancelButton = document.createElement("button");
        cancelButton.innerText = "Cancel";
        cancelButton.style.marginTop = "20px";
        cancelButton.style.padding = "10px";
        cancelButton.style.background = "#004080";
        cancelButton.style.color = "white";
        cancelButton.style.border = "none";
        cancelButton.style.cursor = "pointer";
        cancelButton.onclick = () => this.cancelButton();
        this.detailsContainer.appendChild(cancelButton);

        // Append elements
        this.popupContainer.appendChild(this.miniContainer);
        this.popupContainer.appendChild(this.detailsContainer);
        document.body.appendChild(this.popupContainer);

        // Initialize the mini viewer
        this.miniViewer = new MiniViewer(this.meshes, this.viewer, this.popupContainer);
    }

    createPositionInput(labelText, axis) {
        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "10px";

        const label = document.createElement("label");
        label.innerText = labelText;
        label.style.marginRight = "10px";

        const input = document.createElement("input");
        input.type = "number";
        this.meshes.forEach((mesh) => { input.value = Math.round(mesh?.position[axis]) || 0; })
        input.step = "0.1"; // Small increments
        input.oninput = () => this.updatePosition(axis, parseFloat(input.value));

        // if(this.meshes.length > 1) wrapper.style.display = 'none'

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        return wrapper;
    }

    updatePosition(axis, value) {
        if (!this.selectedRectangle || !this.meshes) return;
        this.meshes.forEach(mesh => {
            mesh.position[axis] = value;
        });
    }

    updateMaterial(property, value) {
        if (!this.selectedRectangle || !this.meshes) return;
        this.meshes.forEach(mesh => {
            const material = mesh.material;
            switch (property) {
                case 'color':
                    material.color.set(value);
                    break;
                case 'transparency':
                    material.transparent = value;
                    break;
                case 'opacity':
                    material.opacity = value;
                    break;
                case 'metalness':
                    material.metalness = value;
                    break;
                case 'roughness':
                    material.roughness = value;
                    break;
                default:
                    console.warn(`Unknown property: ${property}`);
            }
            material.needsUpdate = true;
        })
    }

    saveChanges() {
        if (!this.selectedRectangle || !this.meshes) return;
        this.meshes.forEach(mesh => {
            mesh.userData.type = this.typeSelect.value;
        });
        this.popupContainer.remove();
        if (this.onSave) this.onSave();
    }

    cancelButton() {
        if (this.meshes) {
            // Restore initial properties - match each mesh with its corresponding initial properties
            this.meshes.forEach((mesh, index) => {
                const init = this.initialProperties[index];
                if (init) {
                    mesh.position.set(
                        init.position.x,
                        init.position.y,
                        init.position.z
                    );
                    mesh.material.color.set(`${init.color}`);
                    mesh.material.opacity = init.opacity;
                    mesh.material.metalness = init.metalness;
                    mesh.material.roughness = init.roughness;
                    mesh.userData.type = init.type;
                    mesh.material.needsUpdate = true;
                }
            });
        }
        this.popupContainer.remove();
        if (this.onCancel) this.onCancel();
    }

    createDimensionBox() {
        // Check if the dimension box already exists
        let dimensionBox = document.getElementById("dimension-box");
        if (!dimensionBox) {
            dimensionBox = document.createElement("div");
            dimensionBox.id = "dimension-box";
            document.body.appendChild(dimensionBox);
        }
    }

    async handleItemClick(itemId, type) {
        try {
            const [selectedData, dataType] = await API.handleItemClick(itemId, type);
            if (dataType === 'article') {
                // this.miniViewer.loadArticleData(selectedData);
            } else if (dataType === 'part') {
                // this.meshes.forEach((mesh)=>{
                    this.miniViewer.loadPartData(selectedData);
                // })
            } else if (dataType === 'profile') {
                // this.miniViewer.loadProfileData(selectedData);
            } else if (dataType === 'item master') {
                // this.miniViewer.loadItemMasterData(selectedData);
            }
        } catch (error) {
            console.error('Error loading part data:', error);
        }
    }
}

export { Popup };
