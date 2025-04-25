class UserInterface {
    constructor(viewer) {
        this.completeViewer = viewer;
        this.createUI();
    }

    createUI() {
        this.createHeader();
        this.createTopToolbar();
        this.createSidebar();
        this.createSnapWarningBox();
    }

    createHeader() {
        const header = document.createElement('header');
        header.innerHTML = `
            <div class="logo">CONFIGURAT<span class="gear">⚙️</span>R</div>
        `;
        document.body.appendChild(header);
    }

    createSidebar() {
        const sideBarContainer = document.getElementById('sideBarContainer') || document.createElement('div');
        sideBarContainer.id = 'sideBarContainer';
        document.body.appendChild(sideBarContainer);

        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';

        const overallDefaults = { Width: 500, Height: 750, Depth: 500 };
        const rectangleDefaults = { Width: 500, Height: 750, Depth: 19 }; 
       /*  const overallDefaults = { Width: 3000, Height: 2200, Depth: 300 };
        const rectangleDefaults = { Width: 200, Height: 2200, Depth: 200 }; */

        const overallPanel = this.createPanel(
            'OVERALL DIMENSIONS',
            ['Width', 'Height', 'Depth'],
            (inputs) => this.handleOverallDimensions(inputs),
            overallDefaults,
            'horizontal' // layout
        );
        sidebar.appendChild(overallPanel);

        const rectanglePanel = this.createPanel(
            'ADD RECTANGLE',
            ['Width', 'Height', 'Depth'],
            (inputs) => this.handleRectangleAddition(inputs),
            rectangleDefaults,
            'horizontal'
        );
        sidebar.appendChild(rectanglePanel);

         setTimeout(() => {
            overallPanel.querySelector('.add-btn').click();
            setTimeout(() => rectanglePanel.querySelector('.add-btn').click(), 200);
        }, 200); 




        sideBarContainer.appendChild(sidebar);
    }

    createPanel(title, fields, onAdd, defaultValues = {}, layout = 'vertical') {
        const panel = document.createElement('div');
        panel.className = 'panel';
        panel.innerHTML = `<div class="panel-header">${title}</div>`;

        const panelBody = document.createElement('div');
        panelBody.className = 'panel-body';

        if (layout === 'horizontal') {
            panelBody.classList.add('horizontal-inputs');
        }

        const inputs = {};
        const inputRow = document.createElement('div');
        inputRow.className = 'input-row';

        fields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'input-group';

            const wrapper = document.createElement('div');
            wrapper.className = 'input-wrapper';

            const prefix = document.createElement('span');
            prefix.className = 'input-prefix';
            prefix.innerText = field[0]; // W, H, D

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'in mm';
            input.value = defaultValues[field] || '';
            inputs[field] = input;

            wrapper.appendChild(prefix);
            wrapper.appendChild(input);
            group.appendChild(wrapper);
            inputRow.appendChild(group);
        });

        panelBody.appendChild(inputRow);

        const button = this.createButton('ADD', 'add-btn', () => onAdd(inputs));
        panelBody.appendChild(button);

        panel.appendChild(panelBody);
        return panel;
    }




    createButton(text, className, onClick) {
        const button = document.createElement('button');
        button.className = className;
        button.innerText = text;
        button.onclick = onClick;
        return button;
    }

    handleOverallDimensions(inputs) {
        const width = Number(inputs.Width.value.trim());
        const height = Number(inputs.Height.value.trim());
        const depth = Number(inputs.Depth.value.trim());

        if (!width || !height || width < 100 || width > 3500 || height < 100 || height > 3500 || depth < 0 || depth > 3500) {
            alert('Enter valid dimensions (100-2000mm for width/height, 0-50mm for depth)');
            return;
        }

        this.completeViewer.overallWidth = width;
        this.completeViewer.overallHeight = height;
        this.completeViewer.overallDepth = depth;
        this.completeViewer.bodies.addOverallDimension(width, height, depth);
    }

    handleRectangleAddition(inputs) {
        const widthBox = Number(inputs.Width.value.trim());
        const heightBox = Number(inputs.Height.value.trim());
        const depthBox = Number(inputs.Depth.value.trim());

        if (!this.completeViewer.overallWidth || !this.completeViewer.overallHeight) {
            alert('First add overall dimension');
            return;
        }

        if (!widthBox || !heightBox || !depthBox || widthBox > this.completeViewer.overallWidth || heightBox > this.completeViewer.overallHeight || depthBox > this.completeViewer.overallDepth) {
            alert('Rectangle dimensions must be less than or equals to overall dimensions');
            return;
        }

        this.completeViewer.bodies.addRectangle({ widthBox, heightBox, depthBox });
    }

    createSnapWarningBox() {
        const warningBox = document.createElement("div");
        warningBox.id = "snap-warning";
        warningBox.style.cssText = `
            position: absolute;
            top: 60px;
            left: 60%;
            transform: translateX(-50%);
            padding: 10px 20px;
            background-color: rgba(255, 100, 100, 0.9);
            color: white;
            font-family: sans-serif;
            font-size: 14px;
            border-radius: 8px;
            display: none;
            z-index: 10;
            pointer-events: none;
        `;
        document.body.appendChild(warningBox);
    }


    createTopToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'top-toolbar';
        toolbar.style.cssText = `
            position: absolute;
            top: 830px;
            left: 60%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            padding: 8px 12px;
            background-color:#004080;
            border-radius: 8px;
            z-index: 100;
        `;



        const snapBtn = this.createIconButton('snap-btn', () => this.completeViewer.bodies.switchSnap());

        const transformBtn = this.createIconButton('transform-btn', () => this.completeViewer.bodies.toggleTransformMode());
        const modeBtn = this.createIconButton('mode-btn', () => this.completeViewer.switchMode());

        toolbar.appendChild(snapBtn);
        toolbar.appendChild(transformBtn);
        toolbar.appendChild(modeBtn);
        document.body.appendChild(toolbar);
    }

    // Generic icon button creator
    createIconButton(className, onClick) {
        const btn = document.createElement('button');
        btn.className = className;
        btn.style.cssText = `
            background: none;
            border: none;
            width: 40px;
            height: 40px;
            background-size: contain;
            background-repeat: no-repeat;
            cursor: pointer;
        `;

        // Set image via class or add logic to inject image path here
        if (className === 'snap-btn') {
            btn.style.backgroundImage = `url('https://ik.imagekit.io/tub6tn2qk8/snap-icon.png?updatedAt=1744287479894')`
        } else if (className === 'transform-btn') {
            btn.style.backgroundImage = `url('https://ik.imagekit.io/tub6tn2qk8/transform-icon.png?updatedAt=1744287479810')`;
        } else if (className === 'mode-btn') {
            btn.style.backgroundImage = `url('https://ik.imagekit.io/tub6tn2qk8/3d_rotation.png?updatedAt=1744287481007')`;
        }

        btn.onclick = onClick;
        return btn;
    }


}

export { UserInterface };
