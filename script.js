// Zernike polynomial definitions and visualization
class ZernikeVisualizer {
    constructor() {
        this.pyramidContainer = document.getElementById('pyramid-container');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modeDescription = document.getElementById('mode-description');
        this.closeBtn = document.querySelector('.close');
        this.canvas2D = document.getElementById('canvas-2d');
        this.ctx2D = this.canvas2D.getContext('2d');
        this.canvas3DContainer = document.getElementById('canvas-3d-container');
        
        // Zernike modes information (ANSI standard indices)
        this.zernikeModes = [
            { n: 0, m: 0, name: "Piston", description: "Constant phase shift across the aperture." },
            { n: 1, m: -1, name: "Vertical Tilt", description: "Tilt in the vertical direction." },
            { n: 1, m: 1, name: "Horizontal Tilt", description: "Tilt in the horizontal direction." },
            { n: 2, m: -2, name: "Oblique Astigmatism", description: "Astigmatism at 45°." },
            { n: 2, m: 0, name: "Defocus", description: "Focus error." },
            { n: 2, m: 2, name: "Vertical Astigmatism", description: "Astigmatism at 0° or 90°." },
            { n: 3, m: -3, name: "Vertical Trefoil", description: "Three-fold symmetry, vertical." },
            { n: 3, m: -1, name: "Vertical Coma", description: "Coma in the vertical direction." },
            { n: 3, m: 1, name: "Horizontal Coma", description: "Coma in the horizontal direction." },
            { n: 3, m: 3, name: "Oblique Trefoil", description: "Three-fold symmetry, oblique." },
            { n: 4, m: -4, name: "Oblique Quadrafoil", description: "Four-fold symmetry, oblique." },
            { n: 4, m: -2, name: "Oblique Secondary Astigmatism", description: "Secondary astigmatism, oblique." },
            { n: 4, m: 0, name: "Primary Spherical", description: "Spherical aberration." },
            { n: 4, m: 2, name: "Vertical Secondary Astigmatism", description: "Secondary astigmatism, vertical." },
            { n: 4, m: 4, name: "Vertical Quadrafoil", description: "Four-fold symmetry, vertical." }
        ];
        
        this.init();
    }
    
    init() {
        this.createPyramid();
        this.setupEventListeners();
    }
    
    createPyramid() {
        // Create pyramid rows based on radial order n
        let maxN = 4; // Up to 4th order for this example
        
        for (let n = 0; n <= maxN; n++) {
            const row = document.createElement('div');
            row.className = 'pyramid-row';
            
            // Calculate number of modes for this radial order
            for (let m = -n; m <= n; m += 2) {
                const modeIndex = this.getModeIndex(n, m);
                if (modeIndex !== -1) {
                    const modeElement = this.createModeElement(n, m, modeIndex);
                    row.appendChild(modeElement);
                }
            }
            
            this.pyramidContainer.appendChild(row);
        }
    }
    
    getModeIndex(n, m) {
        return this.zernikeModes.findIndex(mode => mode.n === n && mode.m === m);
    }
    
    createModeElement(n, m, index) {
        const mode = this.zernikeModes[index];
        const modeElement = document.createElement('div');
        modeElement.className = 'zernike-mode';
        modeElement.dataset.n = n;
        modeElement.dataset.m = m;
        modeElement.dataset.index = index;
        
        // Create container for both previews
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';
        
        // Create canvas for 3D preview
        const canvas3D = document.createElement('canvas');
        canvas3D.className = 'preview-3d';
        canvas3D.width = 140;
        canvas3D.height = 60;
        
        // Create canvas for 2D preview
        const canvas2D = document.createElement('canvas');
        canvas2D.className = 'preview-2d';
        canvas2D.width = 140;
        canvas2D.height = 30;
        
        // Create polynomial ordering number (bottom left)
        const orderingLabel = document.createElement('div');
        orderingLabel.className = 'ordering-label';
        orderingLabel.textContent = `${index + 1}`;
        
        // Create Zernike term label (bottom right)
        const zernikeLabel = document.createElement('div');
        zernikeLabel.className = 'zernike-label';
        // Format as Z with subscript n and superscript m
        zernikeLabel.innerHTML = `Z<sub>${n}</sub><sup>${m >= 0 ? m : Math.abs(m)}</sup>${m < 0 ? '⁻' : ''}`;
        
        // Create aberration name (underneath)
        const nameLabel = document.createElement('div');
        nameLabel.className = 'name-label';
        nameLabel.textContent = mode.name;
        
        previewContainer.appendChild(canvas3D);
        previewContainer.appendChild(canvas2D);
        modeElement.appendChild(previewContainer);
        modeElement.appendChild(orderingLabel);
        modeElement.appendChild(zernikeLabel);
        modeElement.appendChild(nameLabel);
        
        // Draw previews
        this.drawZernikePreview3D(canvas3D, n, m);
        this.drawZernikePreview2D(canvas2D, n, m);
        
        // Add click event
        modeElement.addEventListener('click', () => {
            this.showModal(n, m, index);
        });
        
        return modeElement;
    }
    
    drawZernikePreview3D(canvas, n, m) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const radius = 30;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Clear canvas with semi-transparent background
        ctx.clearRect(0, 0, width, height);
        
        // Draw the 3D representation with 45-degree perspective
        const resolution = 200;
        const cellSize = radius * 2 / resolution;
        
        // Draw the surface
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const x = (i - resolution/2) * cellSize;
                const y = (j - resolution/2) * cellSize;
                const r = Math.sqrt(x*x + y*y) / radius;
                
                if (r <= 1) {
                    const theta = Math.atan2(y, x);
                    const z = this.calculateZernike(n, m, r, theta) * 7;
                    
                    // Apply 45-degree perspective transformation
                    const perspectiveX = x;
                    const perspectiveY = y * 0.5 - z;
                    
                    // Map value to color using traditional Zernike gradient
                    const normalizedValue = z / 7;
                    const color = this.getZernikeColor(normalizedValue);
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        centerX + perspectiveX - cellSize/2, 
                        centerY + perspectiveY - cellSize/2, 
                        cellSize, 
                        cellSize
                    );
                    
                    // Draw wireframe
                    // ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                    // ctx.strokeRect(
                    //     centerX + perspectiveX - cellSize/2, 
                    //     centerY + perspectiveY - cellSize/2, 
                    //     cellSize, 
                    //     cellSize
                    // );
                }
            }
        }
        
        // Draw the base circle
        // ctx.beginPath();
        // ctx.ellipse(centerX, centerY, radius, radius * 0.5, 0, 0, 2 * Math.PI);
        // ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        // ctx.lineWidth = 1;
        // ctx.stroke();
    }
    
    drawZernikePreview2D(canvas, n, m) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const radius = 30;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw circular aperture
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius, radius * 0.5, 0, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(240, 240, 240, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.stroke();
        
        // Calculate Zernike values
        const resolution = 200;
        const cellSize = radius * 2 / resolution;
        
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const x = (i - resolution/2) * cellSize;
                const y = (j - resolution/2) * cellSize * 0.5; // Compress for perspective
                const r = Math.sqrt(x*x + y*y*4) / radius; // Adjust for ellipse
                
                if (r <= 1) {
                    const theta = Math.atan2(y * 2, x); // Adjust theta for ellipse
                    const value = this.calculateZernike(n, m, r, theta);
                    
                    // Map value to color using traditional Zernike gradient
                    const color = this.getZernikeColor(value);
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        centerX + x - cellSize/2, 
                        centerY + y - cellSize/2, 
                        cellSize, 
                        cellSize
                    );
                }
            }
        }
    }
    
    calculateZernike(n, m, r, theta) {
        // Calculate radial polynomial
        let R = 0;
        for (let k = 0; k <= (n - Math.abs(m)) / 2; k++) {
            const numerator = Math.pow(-1, k) * this.factorial(n - k);
            const denominator = this.factorial(k) * this.factorial((n + Math.abs(m))/2 - k) * this.factorial((n - Math.abs(m))/2 - k);
            R += numerator / denominator * Math.pow(r, n - 2*k);
        }
        
        // Calculate angular component
        let angular;
        if (m >= 0) {
            angular = Math.cos(m * theta);
        } else {
            angular = Math.sin(Math.abs(m) * theta);
        }
        
        return R * angular;
    }
    
    factorial(num) {
        if (num < 0) return -1;
        if (num === 0) return 1;
        let result = 1;
        for (let i = 1; i <= num; i++) {
            result *= i;
        }
        return result;
    }
    
    getZernikeColor(value) {
        // Normalize value to [-1, 1] range
        const normalizedValue = Math.max(-1, Math.min(1, value));
        
        // Map to [0, 1] range for gradient calculation
        const t = (normalizedValue + 1) / 2;
        
        let r, g, b, alpha;
        
        if (t < 0.25) {
            // Blue to Light Blue
            const localT = t / 0.25;
            r = Math.round(100 * (1 - localT) + 135 * localT);
            g = Math.round(100 * (1 - localT) + 206 * localT);
            b = Math.round(255);
            alpha = 0.7 + 0.3 * Math.abs(normalizedValue);
        } else if (t < 0.5) {
            // Light Blue to Green
            const localT = (t - 0.25) / 0.25;
            r = Math.round(135 * (1 - localT) + 50 * localT);
            g = Math.round(206 * (1 - localT) + 205 * localT);
            b = Math.round(255 * (1 - localT) + 50 * localT);
            alpha = 0.7 + 0.3 * Math.abs(normalizedValue);
        } else if (t < 0.75) {
            // Green to Yellow
            const localT = (t - 0.5) / 0.25;
            r = Math.round(50 * (1 - localT) + 255 * localT);
            g = Math.round(205 * (1 - localT) + 255 * localT);
            b = Math.round(50 * (1 - localT) + 0 * localT);
            alpha = 0.7 + 0.3 * Math.abs(normalizedValue);
        } else {
            // Yellow to Red
            const localT = (t - 0.75) / 0.25;
            r = Math.round(255);
            g = Math.round(255 * (1 - localT) + 0 * localT);
            b = Math.round(0);
            alpha = 0.7 + 0.3 * Math.abs(normalizedValue);
        }
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    setupEventListeners() {
        // Close modal when clicking the X
        this.closeBtn.addEventListener('click', () => {
            this.modal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.modal.style.display = 'none';
            }
        });
    }
    
    showModal(n, m, index) {
        const mode = this.zernikeModes[index];
        this.modalTitle.textContent = `Z${index}: ${mode.name} (n=${n}, m=${m})`;
        this.modeDescription.textContent = mode.description;
        
        // Draw detailed 2D visualization
        this.drawDetailed2D(n, m);
        
        // Create 3D visualization
        this.create3DVisualization(n, m);
        
        // Show modal
        this.modal.style.display = 'block';
    }
    
    drawDetailed2D(n, m) {
        const width = this.canvas2D.width = 500;
        const height = this.canvas2D.height = 500;
        const radius = Math.min(width, height) * 0.4;
        
        // Clear canvas
        this.ctx2D.clearRect(0, 0, width, height);
        
        // Draw circular aperture
        this.ctx2D.beginPath();
        this.ctx2D.arc(width/2, height/2, radius, 0, 2 * Math.PI);
        this.ctx2D.fillStyle = '#f0f0f0';
        this.ctx2D.fill();
        this.ctx2D.strokeStyle = '#999';
        this.ctx2D.lineWidth = 2;
        this.ctx2D.stroke();
        
        // Calculate Zernike values with higher resolution
        const resolution = 300;
        const cellSize = radius * 2 / resolution;
        
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const x = (i - resolution/2) * cellSize;
                const y = (j - resolution/2) * cellSize;
                const r = Math.sqrt(x*x + y*y) / radius;
                
                if (r <= 1) {
                    const theta = Math.atan2(y, x);
                    const value = this.calculateZernike(n, m, r, theta);
                    
                    // Map value to color using traditional Zernike gradient
                    const color = this.getZernikeColor(value);
                    
                    this.ctx2D.fillStyle = color;
                    this.ctx2D.fillRect(
                        width/2 + x - cellSize/2, 
                        height/2 + y - cellSize/2, 
                        cellSize, 
                        cellSize
                    );
                }
            }
        }
        
        // Add contour lines
        this.ctx2D.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx2D.lineWidth = 1;
        
        for (let contour = -0.8; contour <= 0.8; contour += 0.4) {
            this.drawContour(n, m, radius, width/2, height/2, contour);
        }
    }
    
    drawContour(n, m, radius, centerX, centerY, level) {
        const points = [];
        const resolution = 200;
        
        for (let i = 0; i < resolution; i++) {
            const theta = (i / resolution) * 2 * Math.PI;
            let rLow = 0;
            let rHigh = 1;
            let rMid;
            
            // Binary search for contour point at this angle
            for (let iter = 0; iter < 20; iter++) {
                rMid = (rLow + rHigh) / 2;
                const value = this.calculateZernike(n, m, rMid, theta);
                
                if (Math.abs(value - level) < 0.01) {
                    break;
                } else if (value > level) {
                    rHigh = rMid;
                } else {
                    rLow = rMid;
                }
            }
            
            if (Math.abs(this.calculateZernike(n, m, rMid, theta) - level) < 0.1) {
                points.push({
                    x: centerX + rMid * radius * Math.cos(theta),
                    y: centerY + rMid * radius * Math.sin(theta)
                });
            }
        }
        
        if (points.length > 2) {
            this.ctx2D.beginPath();
            this.ctx2D.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                this.ctx2D.lineTo(points[i].x, points[i].y);
            }
            
            this.ctx2D.closePath();
            this.ctx2D.stroke();
        }
    }
    
    create3DVisualization(n, m) {
        // Clear previous 3D visualization
        while (this.canvas3DContainer.firstChild) {
            this.canvas3DContainer.removeChild(this.canvas3DContainer.firstChild);
        }
        
        // Create new canvas for Three.js
        const canvas3D = document.createElement('canvas');
        canvas3D.id = 'canvas-3d';
        canvas3D.style.width = '100%';
        canvas3D.style.height = '100%';
        this.canvas3DContainer.appendChild(canvas3D);
        
        // Set up Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas3D, antialias: true });
        renderer.setSize(500, 500);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Create Zernike surface geometry
        const geometry = new THREE.PlaneGeometry(2, 2, 500, 500);
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i+1];
            const r = Math.sqrt(x*x + y*y);
            
            if (r <= 1) {
                const theta = Math.atan2(y, x);
                const z = this.calculateZernike(n, m, r, theta) * 0.5;
                positions[i+2] = z;
            } else {
                positions[i+2] = 0;
            }
        }
        
        geometry.computeVertexNormals();
        
        // Create material with color based on height
        const material = new THREE.MeshPhongMaterial({
            color: 0x2196F3,
            wireframe: false,
            side: THREE.DoubleSide
        });
        
        const surface = new THREE.Mesh(geometry, material);
        scene.add(surface);
        
        // Position camera at 45-degree angle
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0, 0);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(1.5);
        scene.add(axesHelper);
        
        // Add grid helper for better spatial reference
        const gridHelper = new THREE.GridHelper(2, 10);
        scene.add(gridHelper);
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            surface.rotation.y += 0.005;
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = this.canvas3DContainer.clientWidth / this.canvas3DContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(this.canvas3DContainer.clientWidth, this.canvas3DContainer.clientHeight);
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZernikeVisualizer();
});